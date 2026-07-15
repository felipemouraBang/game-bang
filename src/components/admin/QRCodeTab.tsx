import React from 'react';
import QRCode from 'react-qr-code';
import { QrCode, Globe, Download, CheckCircle, ExternalLink } from 'lucide-react';

export default function QRCodeTab() {
  const checkinValue = "https://game-bang.vercel.app/?action=checkin";
  const siteUrl = "https://game-bang.vercel.app/";

  const handleDownload = (id: string, fileName: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <QrCode className="w-7 h-7 text-orange-500" />
          Gerenciador de QR Codes
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Abaixo você encontra os códigos QR para controle de presença presencial (Check-in) e para divulgação/acesso ao aplicativo.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Card 1: Check-in */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between hover:border-slate-700 transition-all duration-200 shadow-xl">
          <div className="w-full flex flex-col items-center">
            <div className="bg-white p-5 rounded-xl shadow-md mb-6 flex items-center justify-center">
              <QRCode id="qr-checkin" value={checkinValue} size={200} level="H" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-bold text-white">QR Code de Check-in</h3>
            </div>
            <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed px-2">
              Se escaneado pelo app realiza o check-in; se escaneado pela câmera nativa do celular, acessa o link do app. Permite apenas um check-in por dia por aluno.
            </p>
          </div>
          
          <div className="w-full flex gap-2">
            <button
              onClick={() => handleDownload('qr-checkin', 'qr_checkin_bang.svg')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-semibold transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar QR (SVG)
            </button>
          </div>
        </div>

        {/* Card 2: App / Site Download */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between hover:border-slate-700 transition-all duration-200 shadow-xl">
          <div className="w-full flex flex-col items-center">
            <div className="bg-white p-5 rounded-xl shadow-md mb-6 flex items-center justify-center">
              <QRCode id="qr-site" value={siteUrl} size={200} level="H" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-white">Acesso / Download</h3>
            </div>
            <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed px-2">
              Aponte a câmera para acessar o aplicativo web e instalar no celular (PWA). Link de destino: <span className="text-orange-400 font-medium">game-bang.vercel.app</span>
            </p>
          </div>
          
          <div className="w-full flex gap-2">
            <button
              onClick={() => handleDownload('qr-site', 'qr_acesso_site_bang.svg')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-semibold transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar QR (SVG)
            </button>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all text-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Acessar Link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
