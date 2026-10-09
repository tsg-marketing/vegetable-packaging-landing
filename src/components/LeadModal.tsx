import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { LeadPayload } from "@/lib/lead";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

type Errors = { name?: string; phone?: string; email?: string; agree?: string };

type Props = {
  open: boolean;
  productName?: string;
  onClose: () => void;
  onSubmit: (payload: LeadPayload) => Promise<boolean>;
};

export default function LeadModal({ open, productName, onClose, onSubmit }: Props) {
  const [data, setData] = useState({ name: "", phone: "", email: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (open) {
      setData({ name: "", phone: "", email: "" });
      setAgree(false);
      setErrors({});
      setSubmitting(false);
    }
  }, [open, productName]);

  const submit = async () => {
    const errs: Errors = {};
    if (data.name.trim().length < 2) errs.name = "Укажите имя";
    if (!isValidPhoneRu(data.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (data.email.trim() && !EMAIL_RE.test(data.email.trim())) errs.email = "Укажите корректный e-mail";
    if (!agree) errs.agree = "Необходимо согласие";
    setErrors(errs);
    if (Object.keys(errs).length > 0 || submitting) return;
    setSubmitting(true);
    await onSubmit({
      source: "fos",
      product: productName || "",
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
    });
    setSubmitting(false);
    onClose();
    setThanks(true);
  };

  const inputCls = "w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors";
  const labelCls = "text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 md:p-8 relative my-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10" aria-label="Закрыть">
              <Icon name="X" size={18} className="text-[#1A1A1A]" />
            </button>

            <h3 className="font-bold text-2xl text-[#1A1A1A] mb-2 pr-10">Оставить заявку</h3>
            <p className="text-[15px] text-[#666] mb-5 leading-relaxed break-words">
              {productName
                ? <>По товару: <span className="font-semibold text-[#1A1A1A]">{productName}</span></>
                : "Менеджер свяжется с Вами в ближайшее время."}
            </p>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Имя <span style={{ color: "var(--orange)" }}>*</span></label>
                <input type="text" placeholder="Иван Петров" value={data.name}
                  onChange={e => { setData({ ...data, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                  className={inputCls} style={{ borderColor: errors.name ? "#E53935" : "#E0E0E0" }} />
                {errors.name && <p className="text-[13px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className={labelCls}>Телефон <span style={{ color: "var(--orange)" }}>*</span></label>
                <input type="tel" placeholder="+7 (___) ___-__-__" value={data.phone}
                  onChange={e => { setData({ ...data, phone: formatPhoneRu(e.target.value) }); if (errors.phone) setErrors({ ...errors, phone: undefined }); }}
                  onFocus={e => { if (!e.target.value) setData({ ...data, phone: "+7 " }); }}
                  className={inputCls} style={{ borderColor: errors.phone ? "#E53935" : "#E0E0E0" }} />
                {errors.phone && <p className="text-[13px] text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <input type="email" placeholder="your@email.com" value={data.email}
                  onChange={e => { setData({ ...data, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                  className={inputCls} style={{ borderColor: errors.email ? "#E53935" : "#E0E0E0" }} />
                {errors.email && <p className="text-[13px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={agree}
                  onChange={e => { setAgree(e.target.checked); if (errors.agree) setErrors({ ...errors, agree: undefined }); }}
                  className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
                <PolicyDisclaimer />
              </label>
              {errors.agree && <p className="text-[13px] text-red-500 -mt-2">{errors.agree}</p>}

              <button onClick={submit} disabled={submitting} className="btn-orange w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "Отправляем…" : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {thanks && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setThanks(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-7 md:p-9 relative text-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setThanks(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" aria-label="Закрыть">
              <Icon name="X" size={18} className="text-[#1A1A1A]" />
            </button>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,102,0,0.1)" }}>
              <Icon name="Check" size={32} style={{ color: "var(--orange)" }} />
            </div>
            <h3 className="font-bold text-[22px] text-[#1A1A1A] mb-3 leading-tight">Спасибо за обращение в нашу компанию</h3>
            <p className="text-[#555] leading-relaxed mb-6">Менеджер свяжется с Вами в ближайшее время в часы работы.</p>
            <button onClick={() => setThanks(false)} className="btn-orange px-10 py-3">Хорошо</button>
          </div>
        </div>
      )}
    </>
  );
}
