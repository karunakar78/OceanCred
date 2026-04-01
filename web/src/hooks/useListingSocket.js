import { useEffect, useRef } from 'react';
import { connectWebSocket } from '../api';

export function useListingSocket(listingId, onNewBid) {
  const ref = useRef(onNewBid);
  ref.current = onNewBid;

  useEffect(() => {
    const cleanup = connectWebSocket(listingId, (data) => {
      if (data.event === 'new_bid') {
        ref.current(data.amount);
      }
    });
    return cleanup;
  }, [listingId]);
}
