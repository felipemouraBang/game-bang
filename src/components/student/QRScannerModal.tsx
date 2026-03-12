import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Loader2, CheckCircle } from 'lucide-react';

export default function QRScannerModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText) {
      if (decodedText === 'BANG_FIGHT_CHECKIN_QR') {
        scanner.clear();
        handleCheckin();
      } else {
        setError('QR Code inválido para check-in.');
      }
    }

    function onScanFailure(error) {
      // Ignore scan failures as they happen continuously until a code is found
    }

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleCheckin = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/actions/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao realizar check-in.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">Check-in por QR Code</h3>
          
          {success ? (
            <div className="bg-green-500/20 text-green-400 p-6 rounded-xl mt-4 flex flex-col items-center">
              <CheckCircle className="w-12 h-12 mb-2" />
              Check-in realizado com sucesso!
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <p className="text-slate-400">Processando check-in...</p>
            </div>
          ) : (
            <>
              <div id="qr-reader" className="w-full bg-black rounded-lg overflow-hidden border border-slate-700"></div>
              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded mt-4">
                  {error}
                </div>
              )}
              <p className="text-slate-400 text-sm mt-4">
                Aponte a câmera para o QR Code na recepção.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
