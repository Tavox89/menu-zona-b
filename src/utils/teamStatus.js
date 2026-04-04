export function getFriendlyRequestStatus(status) {
  const value = String(status || '').trim();

  if (value === 'pending') return 'Por revisar';
  if (value === 'claimed') return 'En atención';
  if (value === 'pushed') return 'Pedido agregado';
  if (value === 'delivered') return 'Entregado';
  if (value === 'error') return 'Revisar';
  if (value === 'expired') return 'Vencido';

  return value || 'Sin novedad';
}

export function getRequestOriginLabel(source) {
  return String(source || '').trim() === 'waiter' ? 'Pedido del equipo' : 'Pedido del cliente';
}

export function getServiceStageLabel(stage) {
  const value = String(stage || '').trim();

  if (value === 'review') return 'Por revisar';
  if (value === 'working') return 'En atención';
  if (value === 'added') return 'Pedido agregado';
  if (value === 'partial_ready') return 'Listo parcial';
  if (value === 'ready') return 'Listo para entregar';
  if (value === 'delivered') return 'Entregado';

  return '';
}

export function getServiceStageSeverity(stage) {
  const value = String(stage || '').trim();

  if (value === 'review') return 'info';
  if (value === 'working') return 'warning';
  if (value === 'partial_ready') return 'success';
  if (value === 'ready') return 'success';
  if (value === 'delivered') return 'default';
  if (value === 'added') return 'primary';

  return 'default';
}

export function getAvailabilityLabel(availability, managedBy = '') {
  const value = String(availability || '').trim();
  const owner = String(managedBy || '').trim();

  if (value === 'busy') {
    return owner ? `Atiende ${owner}` : 'Atiende otra persona';
  }

  if (value === 'shared') {
    return owner ? `Mesa compartida` : 'Mesa compartida';
  }

  if (value === 'mine') return 'A tu cargo';
  if (value === 'pending') return 'Por revisar';
  if (value === 'view_only') return 'Solo consulta';

  return 'Libre';
}

export function getAvailabilitySeverity(availability) {
  const value = String(availability || '').trim();

  if (value === 'busy') return 'warning';
  if (value === 'shared') return 'primary';
  if (value === 'mine') return 'success';
  if (value === 'pending') return 'info';
  if (value === 'view_only') return 'default';

  return 'success';
}

export function getTableKindLabel(type, availability) {
  if (String(availability || '').trim() === 'view_only') {
    return 'Solo consulta';
  }

  return String(type || '').trim() === 'takeaway' ? 'Para llevar' : 'Mesa';
}

export function getItemServiceLabel(item) {
  const explicitLabel = String(item?.staff_display_state || item?.display_state || '').trim();
  if (explicitLabel) {
    return explicitLabel;
  }

  const serviceState = String(item?.service_state || '').trim();

  if (serviceState === 'ready') return 'Listo';
  if (serviceState === 'delivered') return 'Entregado';
  if (serviceState === 'preparing') return 'En preparación';
  if (serviceState === 'pending') return 'Pendiente';

  const state = String(item?.state || '').trim();
  if (state === 'cancel') return 'Cancelado';

  return '';
}

export function getStationLabel(station) {
  const value = String(station || '').trim();

  if (value === 'bar') return 'Barra';
  if (value === 'horno') return 'Horno';
  return 'Cocina';
}
