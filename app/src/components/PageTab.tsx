import Button from './Button';

interface PageTabProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  tabLabels: string[];
}

export default function PageTab({ activeTab, setActiveTab, tabLabels }: PageTabProps) {
  return (
    <div style={{ background: '#1C4A5C', borderRadius: '0', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'left' }}>
        {tabLabels.map((label, idx) => (
          <Button
            key={label}
            imageSrc={`/tab-icon-${idx + 1}.svg`} // Replace with your actual icon paths
            label={label}
            isActive={activeTab === idx}
            onClick={() => setActiveTab(idx)}
            style={{
              borderRadius: 0,
              background: activeTab === idx ? '#3A6A7C' : undefined,
              color: activeTab === idx ? '#fff' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}