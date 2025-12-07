export default function StatusButton({ status = 1, small = false }) {
  // status: 1=Stable, 2=Unstable, 3=In Dev
  const base = `px-2 py-0.5 rounded-full text-xs font-medium ${small ? 'text-xs' : 'text-sm'}`;
  if (status === 1) return <span className={`${base} bg-green-500/20 text-green-400 border border-green-500/50`}>Stable</span>;
  if (status === 2) return <span className={`${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/50`}>Unstable</span>;
  return <span className={`${base} bg-blue-500/20 text-blue-400 border border-blue-500/50`}>In Dev</span>;
}
