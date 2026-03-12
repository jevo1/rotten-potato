import Image from 'next/image';

interface ButtonProps {
  imageSrc: string;
  alt?: string;
  label?: string;
  onClick: () => void;
  isActive?: boolean;
  style?: React.CSSProperties;
}

export default function SymbolButton({ imageSrc, alt, label, onClick, isActive, style }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        background: isActive ? '#C87941' : '#f2f2f2',
        color: isActive ? '#fff' : '#000',
        cursor: 'pointer',
        ...style,
      }}
    >
      <Image src={imageSrc} alt={alt || 'Symbol'} width={24} height={24} />
      {label && <span>{label}</span>}
    </button>
  );
}