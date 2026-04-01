import os
import smtplib
import ssl
from typing import Optional

from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fpdf import FPDF

from dotenv import load_dotenv

load_dotenv()


def send_email_mock(
    to_email: str, subject: str, body: str, attachment_path: str = None
):
    """Hackathon/demo: prints to the server console only — no real delivery."""
    print("=" * 60)
    print("📧 [MOCK EMAIL — not sent over the internet]")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Attachment: {attachment_path if attachment_path else 'None'}")
    print("-" * 60)
    print(body)
    print("=" * 60)


def send_email(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: Optional[str] = None,
) -> dict:
    """
    Sends via SMTP when SMTP_HOST (and credentials) are set in `.env`.
    Otherwise falls back to `send_email_mock` (console only).

    Set these in `backend/.env`:
      SMTP_HOST=smtp.gmail.com
      SMTP_PORT=587
      SMTP_USER=youraccount@gmail.com
      SMTP_PASSWORD=your_app_password
      SMTP_FROM_EMAIL=youraccount@gmail.com
      SMTP_USE_TLS=true
      # For port 465 with implicit SSL:
      # SMTP_PORT=465
      # SMTP_USE_SSL=true
      # SMTP_USE_TLS=false
    """
    to_email = (to_email or "").strip()
    if not to_email:
        print("[email] Skipped: no recipient address")
        return {"sent": False, "mode": "skipped", "detail": "empty recipient"}

    host = (os.getenv("SMTP_HOST") or "").strip()
    if not host:
        send_email_mock(to_email, subject, body, attachment_path)
        return {
            "sent": False,
            "mode": "mock",
            "detail": "SMTP_HOST not set — configure .env to send real mail",
        }

    port = int(os.getenv("SMTP_PORT", "587"))
    user = (os.getenv("SMTP_USER") or "").strip()
    password = os.getenv("SMTP_PASSWORD") or ""
    from_addr = (os.getenv("SMTP_FROM_EMAIL") or user).strip() or user
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() in ("1", "true", "yes")

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain", "utf-8"))

    if attachment_path and os.path.isfile(attachment_path):
        with open(attachment_path, "rb") as f:
            part = MIMEBase("application", "pdf")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition",
            f'attachment; filename="{os.path.basename(attachment_path)}"',
        )
        msg.attach(part)

    try:
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, timeout=30, context=context) as server:
                if user and password:
                    server.login(user, password)
                server.sendmail(from_addr, [to_email], msg.as_string())
        else:
            context = ssl.create_default_context()
            with smtplib.SMTP(host, port, timeout=30) as server:
                if use_tls:
                    server.starttls(context=context)
                if user and password:
                    server.login(user, password)
                server.sendmail(from_addr, [to_email], msg.as_string())

        print(f"[email] SMTP sent OK → {to_email}")
        return {"sent": True, "mode": "smtp"}
    except Exception as e:
        err = str(e)
        print(f"[email] SMTP error: {err} — logging mock below")
        if "534" in err or "Application-specific password" in err:
            print(
                "[email] Gmail: create an App Password (Google Account → Security → 2-Step → "
                "App passwords) and set SMTP_PASSWORD to that 16-character value, not your normal password."
            )
        send_email_mock(to_email, subject, body, attachment_path)
        return {"sent": False, "mode": "mock", "error": err}


def generate_invoice_pdf(
    transaction_id: int,
    winner_name: str,
    final_price: float,
    credit_key: str,
    date_str: str,
) -> str:
    pdf = FPDF()
    pdf.add_page()

    # Needs a font
    pdf.set_font("Arial", "B", 16)
    pdf.cell(200, 10, txt="SeaCred ESG Invoice", ln=True, align="C")
    pdf.ln(10)

    pdf.set_font("Arial", "", 12)
    pdf.cell(200, 10, txt=f"Invoice Date: {date_str}", ln=True)
    pdf.cell(200, 10, txt=f"Transaction ID: #{transaction_id}", ln=True)
    pdf.cell(200, 10, txt=f"Billed To: {winner_name}", ln=True)
    pdf.cell(200, 10, txt=f"Allocated Credit Key: {credit_key}", ln=True)
    pdf.ln(10)

    # Breakdown
    admin_fee = final_price * 0.10
    fisherman_payout = final_price - admin_fee

    pdf.set_font("Arial", "B", 12)
    pdf.cell(100, 10, txt="Description", border=1)
    pdf.cell(50, 10, txt="Amount ($)", border=1, ln=True)

    pdf.set_font("Arial", "", 12)
    pdf.cell(100, 10, txt="Fisherman Payout (90%)", border=1)
    pdf.cell(50, 10, txt=f"${fisherman_payout:.2f}", border=1, ln=True)

    pdf.cell(100, 10, txt="Platform Fee (10%)", border=1)
    pdf.cell(50, 10, txt=f"${admin_fee:.2f}", border=1, ln=True)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(100, 10, txt="Total Final Bid Price", border=1)
    pdf.cell(50, 10, txt=f"${final_price:.2f}", border=1, ln=True)

    os.makedirs(os.path.join(os.path.dirname(__file__), "invoices"), exist_ok=True)
    file_path = os.path.join(
        os.path.dirname(__file__), "invoices", f"invoice_{transaction_id}.pdf"
    )
    pdf.output(file_path)
    return file_path
