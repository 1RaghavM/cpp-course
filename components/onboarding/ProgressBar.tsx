type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="ob-progress">
      <span className="ob-progress-text">
        {current} / {total}
      </span>
      <div className="ob-progress-track">
        <div className="ob-progress-fill" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}
