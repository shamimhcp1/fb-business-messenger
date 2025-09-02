"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { socket } from "../app/socket";

export function HomePage() {

  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  // Check if the socket is connected
  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">FB Business Messenger</h1>
      <p className="text-sm text-gray-500">
        Manage your Facebook messaging in one place.
      </p>
      <div className="flex gap-4">
        <Link
          href="/connections"
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Connect Page
        </Link>
        <Link
          href="/inbox"
          className="inline-flex items-center px-4 py-2 rounded-md border hover:bg-gray-100"
        >
          Go to Inbox
        </Link>
      </div>
      <div>
        <p>Server Status: {isConnected ? "connected" : "disconnected"}</p>
        <p>Server Transport: {transport}</p>
      </div>
    </main>
  );
}
