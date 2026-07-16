interface LegalInfoProps {
  className?: string;
}

/** Юридические реквизиты организации для футера. */
export default function LegalInfo({ className = "" }: LegalInfoProps) {
  return (
    <p className={`text-xs text-white/35 leading-relaxed ${className}`}>
      Общество с ограниченной ответственностью «Техно-Сиб Групп».
      Юридический адрес: 630005, г. Новосибирск, ул. Крылова, д. 36, этаж 8, офис 81.
      {" "}ИНН 5406804844 · ОГРН 1205400012146 · КПП 540601001
    </p>
  );
}
