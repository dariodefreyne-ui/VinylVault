import { useState, useMemo } from 'react';
import { useWishlist } from '../hooks/useWishlist.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { isBeheerder } from '../utils/roles.js';
import WishlistCard from '../components/wishlist/WishlistCard.jsx';
import WishlistForm from '../components/wishlist/WishlistForm.jsx';
import DetailModal from '../components/ui/DetailModal.jsx';
import Chip from '../components/ui/Chip.jsx';
import { colors, buttonStyle } from '../styles/tokens.js';

const STATUS_FILTERS = [
  { value: 'alles', label: 'Alles' },
  { value: 'actief', label: 'Actief' },
  { value: 'gevonden', label: 'Gevonden' },
  { value: 'gekocht', label: 'Gekocht' },
];

export default function Wishlist() {
  const { items, loading, addWishlistItem, updateWishlistItem } = useWishlist();
  const { role } = useAuth();

  const [statusFilter, setStatusFilter] = useState('alles');
  const [ownerFilter, setOwnerFilter] = useState('alles');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const activeCount = useMemo(
    () => items.filter((i) => i.status === 'actief').length,
    [items]
  );

  // Dynamische eigenaar-filters, afgeleid uit de wishlist-items (geen hardcoded namen).
  const ownerFilters = useMemo(() => {
    const byKey = new Map();
    for (const i of items) {
      const label = (i.owner || '').trim();
      if (label && !byKey.has(label.toLowerCase())) byKey.set(label.toLowerCase(), label);
    }
    return [
      { value: 'alles', label: 'Alles' },
      ...[...byKey.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'nl', { sensitivity: 'base' }))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;

    if (statusFilter !== 'alles') {
      list = list.filter((i) => i.status === statusFilter);
    }

    if (ownerFilter !== 'alles') {
      list = list.filter(
        (i) => (i.owner || '').toLowerCase() === ownerFilter
      );
    }

    return list;
  }, [items, statusFilter, ownerFilter]);

  function openAdd() {
    setEditItem(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditItem(null);
  }

  async function handleFormSubmit(data) {
    setFormLoading(true);
    try {
      if (editItem) {
        await updateWishlistItem(editItem.id, data);
      } else {
        await addWishlistItem(data);
      }
      closeModal();
    } catch (err) {
      console.error('Wishlist form submit error:', err);
    } finally {
      setFormLoading(false);
    }
  }

  // --- Styles ---

  const pageStyle = {
    color: colors.textPrimary,
    maxWidth: '1100px',
  };

  const headingStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 4px 0',
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: '0 0 24px 0',
  };

  const actionBarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const chipRowStyle = {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const dividerStyle = {
    width: '1px',
    height: '24px',
    backgroundColor: colors.borderColor,
    flexShrink: 0,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  };

  const emptyStyle = {
    color: colors.textSecondary,
    fontSize: '14px',
    padding: '32px 0',
  };

  return (
    <div style={pageStyle}>
      {/* Page header */}
      <h1 style={headingStyle}>Wishlist</h1>
      <p style={subtitleStyle}>
        {loading
          ? 'Laden...'
          : `${activeCount} actieve item${activeCount !== 1 ? 's' : ''}`}
      </p>

      {/* Top action bar */}
      <div style={actionBarStyle}>
        {/* Status filter */}
        <div style={chipRowStyle}>
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            />
          ))}
        </div>

        <div style={dividerStyle} />

        {/* Owner filter */}
        <div style={chipRowStyle}>
          {ownerFilters.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              active={ownerFilter === f.value}
              onClick={() => setOwnerFilter(f.value)}
            />
          ))}
        </div>

        {/* Add button (beheerder only) */}
        {isBeheerder(role) && (
          <button
            style={buttonStyle('primary')}
            onClick={openAdd}
          >
            + Toevoegen
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <p style={emptyStyle}>Laden...</p>
      ) : filtered.length === 0 ? (
        <p style={emptyStyle}>Geen wishlist items gevonden.</p>
      ) : (
        <div style={gridStyle}>
          {filtered.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onClick={setDetailItem}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <DetailModal
        open={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Item bewerken' : 'Item toevoegen'}
      >
        <WishlistForm
          initialData={editItem || {}}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          loading={formLoading}
        />
      </DetailModal>

      {/* Detail view modal (read-only) */}
      <DetailModal
        open={!!detailItem && !modalOpen}
        onClose={() => setDetailItem(null)}
        title={detailItem ? detailItem.artist || 'Item detail' : ''}
      >
        {detailItem && (
          <div style={{ color: colors.textPrimary, fontSize: '14px', lineHeight: 1.6 }}>
            {detailItem.title && (
              <p style={{ margin: '0 0 8px 0', color: colors.textSecondary }}>
                {detailItem.title}
              </p>
            )}
            {detailItem.notes && (
              <p style={{ margin: '0', color: colors.textSecondary }}>
                {detailItem.notes}
              </p>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
