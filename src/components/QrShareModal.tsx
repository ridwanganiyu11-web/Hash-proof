import React, { useEffect, useState } from "react";
import { Download, Copy, Check, ExternalLink, QrCode, X } from "lucide-react";
import { downloadQrCodePng, generateQrCodeDataUrl } from "../utils/qrcode";
import { buildVerificationUrl, shortenHex } from "../utils/hash";

interface QrShareCardProps {
  fileHash: string;
  compact?: boolean;
}

export const QrShareCard: React.FC<QrShareCardProps> = ({ fileHash, compact = false }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const verificationUrl = buildVerificationUrl(fileHash);

  useEffect(() => {
    let mounted = true;
    generateQrCodeDataUrl(verificationUrl)
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch(() => {
        if (mounted) setQrDataUrl("");
      });
    return () => {
      mounted = false;
    };
  }, [verificationUrl]);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(verificationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyHash = async () => {
    await navigator.clipboard.writeText(fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-navy-900/90 p-5">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex flex-col items-center shrink-0">
          <div className="rounded-lg bg-white p-2.5 shadow-md border border-slate-700">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Verification QR code for ${shortenHex(fileHash)}`}
                className={compact ? "w-32 h-32" : "w-40 h-40"}
              />
            ) : (
              <div
                className={`${
                  compact ? "w-32 h-32" : "w-40 h-40"
                } flex items-center justify-center bg-slate-100 text-slate-500 text-xs`}
              >
                Generating QR...
              </div>
            )}
          </div>
          {qrDataUrl && (
            <button
              type="button"
              onClick={() => downloadQrCodePng(qrDataUrl, fileHash)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download QR (PNG)
            </button>
          )}
        </div>

        <div className="flex-1 w-full space-y-3">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Public Verification Link
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Anyone with this link or QR code can verify the file against the on-chain Botchain record without connecting a wallet.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-navy-950 border border-slate-800 px-3 py-2">
            <input
              type="text"
              readOnly
              value={verificationUrl}
              className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="shrink-0 inline-flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy URL
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyHash}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-800 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Hash Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy SHA-256 Hash
                </>
              )}
            </button>

            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600/20 border border-brand-500/40 hover:bg-brand-600/30 px-3 py-1.5 text-xs font-medium text-brand-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Verification Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QrModalProps {
  fileHash: string | null;
  onClose: () => void;
}

export const QrShareModal: React.FC<QrModalProps> = ({ fileHash, onClose }) => {
  if (!fileHash) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-navy-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-semibold text-white">Share Public Verification Proof</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <QrShareCard fileHash={fileHash} />
      </div>
    </div>
  );
};

