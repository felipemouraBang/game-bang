import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, CheckCircle } from 'lucide-react';

export default function QRScannerModal({ onClose }) {
  const [modality, setModality] = useState('checkin_muay_thai');
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        const onScanSuccess = (decodedText: string) => {
          if (decodedText === 'BANG_FIGHT_CHECKIN_QR') {
            html5QrCode.stop().then(() => {
              handleCheckin();
            }).catch(console.error);
          } else {
            setError('QR Code inválido para check-in.');
          }
        };

        try {
          // Try environment camera first (back camera)
          await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, () => {});
        } catch (envErr) {
          console.warn("Environment camera not found, falling back to any camera:", envErr);
          // Fallback to user camera or any available camera
          try {
            await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, () => {});
          } catch (userErr) {
            console.warn("User camera not found, trying default start:", userErr);
            // Last resort: just try to start with any camera
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              await html5QrCode.start(cameras[0].id, config, onScanSuccess, () => {});
            } else {
              throw new Error("Nenhuma câmera encontrada no dispositivo.");
            }
          }
        }
        
        setCameraLoading(false);
        } catch (err: any) {
          console.warn("No camera found or permission denied:", err?.message || err);
          setCameraLoading(false);
          setError('Não foi possível acessar a câmera. Verifique as permissões do navegador ou se o dispositivo possui câmera.');
        }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Use a ref to always have the latest modality in the handleCheckin callback
  const modalityRef = useRef(modality);
  useEffect(() => {
    modalityRef.current = modality;
  }, [modality]);

  const handleCheckin = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/actions/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: modalityRef.current }),
        credentials: 'include'
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      } else {
        let errorMsg = 'Erro ao realizar check-in.';
        try {
          const text = await res.text();
          const data = JSON.parse(text);
          errorMsg = data.error || errorMsg;
        } catch (e) {
          console.error("Non-JSON error response from server");
        }
        setError(errorMsg);
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
              <div className="mb-4 text-left">
                <label className="block text-sm text-slate-400 mb-2">Selecione a Modalidade</label>
                <select 
                  value={modality}
                  onChange={e => setModality(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="checkin_muay_thai">Check-in Muay Thai</option>
                  <option value="checkin_fitness">Check-in Fitness</option>
                  <option value="checkin_fight">Check-in Fight</option>
                </select>
              </div>

              <div className="relative w-full bg-black rounded-lg overflow-hidden border border-slate-700 min-h-[250px] flex items-center justify-center">
                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-2" />
                    <p className="text-slate-400 text-sm">Iniciando câmera...</p>
                  </div>
                )}
                <div id="qr-reader" className="w-full h-full"></div>
              </div>
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
