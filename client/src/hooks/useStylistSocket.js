import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useStylistSocket(stylistId, onChange) {
  // Guardamos el callback en una ref para no reconectar en cada render
  const callbackRef = useRef(onChange);
  useEffect(() => {
    callbackRef.current = onChange;
  });

  useEffect(() => {
    if (!stylistId) return;

    const socket = io(import.meta.env.VITE_API_URL);

    socket.on("connect", () => socket.emit("stylist:join", stylistId));
    socket.on("appointment:created", () => callbackRef.current());
    socket.on("appointment:cancelled", () => callbackRef.current());

    return () => {
      socket.emit("stylist:leave", stylistId);
      socket.disconnect();
    };
  }, [stylistId]);
}