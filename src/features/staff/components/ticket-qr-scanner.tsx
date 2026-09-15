"use client";

import { BrowserCodeReader, BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseStaffTicketQrPayload } from "@/features/staff/ticket-qr-payload";
import { cn } from "@/lib/utils/cn";

type TicketQrScannerProps = {
  busy: boolean;
  onToken: (ticketToken: string) => void;
};

const unsupportedQrMessage = "Unsupported QuickSeat QR code";

export function TicketQrScanner({ busy, onToken }: TicketQrScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const acceptingScanRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [decodingImage, setDecodingImage] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const stopCamera = useCallback(() => {
    acceptingScanRef.current = false;
    controlsRef.current?.stop();
    controlsRef.current = null;

    const video = videoRef.current;
    if (video?.srcObject instanceof MediaStream) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    BrowserCodeReader.releaseAllStreams();
    setCameraActive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  function acceptDecodedPayload(payload: string): boolean {
    const token = parseStaffTicketQrPayload(payload);
    if (!token) {
      setScannerError(unsupportedQrMessage);
      return false;
    }

    setScannerError("");
    onToken(token);
    return true;
  }

  async function decodeImage(file: File) {
    if (busy || decodingImage) return;

    stopCamera();
    setDecodingImage(true);
    setScannerError("");
    const objectUrl = URL.createObjectURL(file);

    try {
      const result = await new BrowserQRCodeReader().decodeFromImageUrl(objectUrl);
      acceptDecodedPayload(result.getText());
    } catch {
      setScannerError(unsupportedQrMessage);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setDecodingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function startCamera() {
    if (busy || decodingImage || cameraActive) return;

    setScannerError("");
    setCameraActive(true);
    acceptingScanRef.current = true;

    try {
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 200 });
      const controls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        videoRef.current ?? undefined,
        (result, _error, callbackControls) => {
          controlsRef.current = callbackControls;
          if (!result || !acceptingScanRef.current) return;

          acceptingScanRef.current = false;
          const accepted = acceptDecodedPayload(result.getText());
          callbackControls.stop();
          controlsRef.current = null;
          BrowserCodeReader.releaseAllStreams();
          setCameraActive(false);

          if (!accepted) {
            window.setTimeout(() => videoRef.current?.focus(), 0);
          }
        },
      );
      controlsRef.current = controls;
    } catch {
      stopCamera();
      setScannerError(
        "Camera access is unavailable. Allow camera permission or choose a QR image instead.",
      );
    }
  }

  return (
    <Card className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">
            QR scanner
          </p>
          <h2 className="mt-2 text-lg font-semibold">Scan a QuickSeat ticket</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--qs-text-muted)]">
            Choose a downloaded QR image or start the camera. Images are decoded only in this browser and are never uploaded.
          </p>
        </div>
      </div>

      <input
        accept="image/*"
        className="sr-only"
        disabled={busy || decodingImage}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void decodeImage(file);
        }}
        ref={fileInputRef}
        type="file"
      />

      <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
        <Button
          className="w-full sm:w-auto"
          disabled={busy || decodingImage}
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
        >
          {decodingImage ? "Reading QR image…" : "Choose QR image"}
        </Button>
        {cameraActive ? (
          <Button className="w-full sm:w-auto" disabled={busy} onClick={stopCamera} variant="danger">
            Stop camera
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" disabled={busy || decodingImage} onClick={() => void startCamera()}>
            Start camera
          </Button>
        )}
      </div>

      <div className={cn("mt-5 overflow-hidden rounded-xl border border-[var(--qs-border)] bg-black", !cameraActive && "hidden")}>
        <video
          aria-label="Live camera preview for scanning a QuickSeat ticket QR code"
          autoPlay
          className="max-h-[65dvh] min-h-52 w-full object-cover sm:aspect-video sm:min-h-0"
          muted
          playsInline
          ref={videoRef}
          tabIndex={-1}
        />
      </div>

      {scannerError ? (
        <p className="mt-4 rounded-lg border border-[#6d2428] bg-[#351112] px-4 py-3 text-sm text-[#ff9999]" role="alert">
          {scannerError}
        </p>
      ) : null}
    </Card>
  );
}
