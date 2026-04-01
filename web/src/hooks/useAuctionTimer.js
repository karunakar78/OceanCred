import { useEffect, useState } from 'react';

export function useAuctionTimer(closesAt) {
  const [label, setLabel] = useState('Calculating...');

  useEffect(() => {
    const end = new Date(closesAt).getTime();

    const tick = () => {
      const now = Date.now();
      const distance = end - now;
      if (distance < 0) {
        setLabel('EXPIRED');
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setLabel(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  return label;
}
