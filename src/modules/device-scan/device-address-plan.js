export const planDeviceAddressChange = (currentId, targetId, occupied) => {
  for (const id of [currentId, targetId]) {
    if (!/^\d{3}$/.test(id) || Number(id) < 1 || Number(id) > 247) throw new RangeError('Device ID must be from 1 to 247');
  }
  if (currentId === targetId) return [];
  if (occupied.has(Number(targetId))) throw new RangeError('That device address is already saved for another device');
  const search = (digits, steps) => {
    if (digits === targetId) return steps;
    for (let index = 0; index < 3; index += 1) {
      if (digits[index] === targetId[index]) continue;
      const next = digits.slice(0, index) + targetId[index] + digits.slice(index + 1);
      const unitId = Number(next);
      if (unitId < 1 || unitId > 247 || occupied.has(unitId)) continue;
      const result = search(next, [...steps, { index, value: targetId.charCodeAt(index), unitId }]);
      if (result) return result;
    }
    return null;
  };
  const steps = search(currentId, []);
  if (!steps) throw new RangeError('Cannot change to that ID without an invalid or occupied intermediate address');
  return steps;
};
