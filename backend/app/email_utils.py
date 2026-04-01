import os
from fpdf import FPDF
from datetime import datetime


# A mock for the hackathon/demo instead of setting up real SMTP credentials
def send_email_mock(
    to_email: str, subject: str, body: str, attachment_path: str = None
):
    print("=" * 60)
    print(f"📧 [MOCK EMAIL SENT]")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Attachment: {attachment_path if attachment_path else 'None'}")
    print("-" * 60)
    print(body)
    print("=" * 60)


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
