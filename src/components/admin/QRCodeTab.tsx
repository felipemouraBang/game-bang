import React from 'react';
import QRCode from 'react-qr-code';
import { QrCode } from 'lucide-react';

export default function QRCodeTab() {
  const qrValue = "BANG_FIGHT_CHECKIN_QR";

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-white p-8 rounded-2xl shadow-2xl mb-8">
        <QRCode value={qrValue} size={256} level="H" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        <QrCode className="w-6 h-6 mr-2 text-orange-500" />
        QR Code de Check-in
      </h2>
      <p className="text-slate-400 text-center max-w-md">
        Peça para os alunos escanearem este QR Code usando o aplicativo para fazer o check-in automático.
        Lembre-se: é permitido apenas um check-in por dia por aluno.
      </p>
    </div>
  );
}
