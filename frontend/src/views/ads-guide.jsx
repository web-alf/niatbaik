// ads-guide.jsx (stub — replaced in Phase 4). Modal: platform ads rules.
function AdsGuideModal({ open, onClose }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Panduan Platform Iklan" size="xl">
      <div className="text-mute text-sm">Panduan Meta / Google / TikTok / Organik — segera hadir.</div>
    </Modal>
  );
}
window.AdsGuideModal = AdsGuideModal;
