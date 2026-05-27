type Props = {
  className?: string;
};

export default function PolicyDisclaimer({ className }: Props) {
  return (
    <p className={`text-[11px] leading-snug text-[#888] ${className || ""}`}>
      Отправляя форму, я соглашаюсь с{" "}
      <a
        href="https://t-sib.ru/assets/politika_t-sib16.05.25.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-orange-600"
      >
        политикой обработки персональных данных
      </a>{" "}
      и даю{" "}
      <a
        href="https://t-sib.ru/assets/soglasie_t-sib16.05.25.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-orange-600"
      >
        согласие на обработку персональных данных
      </a>
      .
    </p>
  );
}
