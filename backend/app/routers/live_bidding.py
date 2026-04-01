from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter(tags=["Live Bidding WebSockets"])

class ConnectionManager:
    def __init__(self):
        # Maps listing_id to a list of active websocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, listing_id: int):
        await websocket.accept()
        if listing_id not in self.active_connections:
            self.active_connections[listing_id] = []
        self.active_connections[listing_id].append(websocket)

    def disconnect(self, websocket: WebSocket, listing_id: int):
        if listing_id in self.active_connections:
            self.active_connections[listing_id].remove(websocket)
            if not self.active_connections[listing_id]:
                del self.active_connections[listing_id]

    async def broadcast(self, message: str, listing_id: int):
        if listing_id in self.active_connections:
            for connection in self.active_connections[listing_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/bidding/{listing_id}")
async def websocket_endpoint(websocket: WebSocket, listing_id: int):
    await manager.connect(websocket, listing_id)
    try:
        while True:
            # Receive data in format: {"company_id": 1, "bid_amount": 1000}
            data = await websocket.receive_text()
            
            # Here we would normally validate JWT natively from WebSocket headers 
            # and verify the bid in the database, then commit the bid.
            # For hackathon realtime demo purposes, we will broadcast the payload back out.
            
            try:
                parsed_data = json.loads(data)
                
                # A proper implementation would invoke the DB insertion here:
                # new_bid = models.Bid(listing_id=listing_id, company_id=parsed_data['company_id'], amount=parsed_data['bid_amount'])
                # db.add(new_bid)
                # db.commit()
                
                broadcast_payload = json.dumps({
                    "event": "new_bid",
                    "listing_id": listing_id,
                    "company_id": parsed_data.get("company_id", "Unknown"),
                    "amount": parsed_data.get("bid_amount"),
                    "message": f"New highest bid: {parsed_data.get('bid_amount')} by Company {parsed_data.get('company_id')}"
                })
                await manager.broadcast(broadcast_payload, listing_id)
            except Exception as e:
                await websocket.send_text(f"Error processing bid data: {str(e)}")

    except WebSocketDisconnect:
        manager.disconnect(websocket, listing_id)
        # await manager.broadcast(json.dumps({"event": "user_left"}), listing_id)
