import Icon from "@/components/ui/icon";

type Props = { onClick: () => void };

export default function QuizSideTab({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Подобрать оборудование"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] shadow-lg hover:shadow-xl transition-shadow rounded-l-xl flex items-center justify-center"
      style={{
        background: "var(--orange)",
        width: 46,
        height: 230,
      }}
    >
      <span
        className="flex items-center gap-2 text-white font-bold uppercase tracking-wide"
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontSize: 14,
          letterSpacing: "0.04em",
        }}
      >
        <Icon name="Smile" size={18} className="text-white" />
        Подобрать оборудование
      </span>
    </button>
  );
}
