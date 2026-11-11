import React, { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';

export default function SharePopover({
  property,
  triggerClassName,
  buttonContent,
  direction = 'down' // 'up' or 'down'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef(null);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const propCode = property?.code || property?.id || '';
    return `${window.location.origin}/#property=${encodeURIComponent(propCode)}`;
  };

  const getTitle = () => {
    return property?.title || 'Chi tiết bất động sản tại 3TV Land';
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleShareFacebook = async (e) => {
    e.stopPropagation();
    const shareUrl = getShareUrl();
    const title = getTitle();
    const priceText = property?.purpose === 'rent' ? (property?.price_rent_text || '') : (property?.price_sale_text || '');
    const fullText = `[3TV LAND] ${title}${priceText ? ' - Giá: ' + priceText : ''} - Xem chi tiết tại: ${shareUrl}`;

    // Tự động sao chép sẵn nội dung bài viết và link vào Clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {}

    const fbUrl = `https://m.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=620,height=600');
    setIsOpen(false);
  };

  const handleShareZalo = (e) => {
    e.stopPropagation();
    const shareUrl = getShareUrl();
    const title = getTitle();
    const priceText = property?.purpose === 'rent' ? (property?.price_rent_text || '') : (property?.price_sale_text || '');
    const desc = `${title}${priceText ? ' - ' + priceText : ''} | 3TV Land`;
    
    const zaloUrl = `https://sp.zalo.me/plugins/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}`;
    window.open(zaloUrl, '_blank', 'noopener,noreferrer,width=600,height=550');
    setIsOpen(false);
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt('Sao chép liên kết:', url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Sao chép liên kết:', url);
    }
  };

  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={triggerClassName || 'p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'}
        title="Chia sẻ bất động sản"
      >
        {buttonContent || <Share2 className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 z-50 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 text-slate-800 animate-in fade-in zoom-in-95 duration-150 ${
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="px-2 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chia sẻ qua
          </div>

          <div className="mt-1 space-y-1">
            {/* Chia sẻ Facebook */}
            <button
              type="button"
              onClick={handleShareFacebook}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                f
              </div>
              <span>Facebook</span>
            </button>

            {/* Chia sẻ Zalo */}
            <button
              type="button"
              onClick={handleShareZalo}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-[#0068FF] text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                Z
              </div>
              <span>Zalo</span>
            </button>

            {/* Sao chép link dự phòng */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shadow-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </div>
              <span>{copied ? 'Đã sao chép link' : 'Sao chép link'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

