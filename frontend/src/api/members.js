import api from './axios';

// Every membership endpoint is listed in this one file. If your server paths differ, change them here.
// The server is expected to reply { status: 'Success', detail: [...] } like your existing API.
const detail = (res) => {
  if (res.data?.status !== 'Success') throw new Error(res.data?.errorDetail || 'Request failed');
  return res.data.detail;
};

// The branch code (e.g. "002") of the branch the person signed in to; it is the prefix of member numbers.
export const branchIdOf = (user) => user?.branch?.code ?? '';
// People with the branch.access_all permission see members of every branch
export const canSeeAllBranches = (user) => !!user?.permissions?.includes('branch.access_all');

export const membersApi = {
  list: ({ all, branchId }) => api.get(all ? '/memberdetail' : `/memberlist/${branchId}`).then(detail),

  get: (memberNo, branchId) =>
    api.get(`/memberdetail/${memberNo}/${branchId}`).then(detail).then((rows) => rows[0]),

  approve: (memberNo, approver) =>
    api.put(`/member-approved/${memberNo}/${encodeURIComponent(approver)}`).then(detail),

  // Photos go as files, so the form values are sent as multipart FormData
  create: (values, branchId) => {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined) data.append(key, value);
    });
    data.append('branchID', branchId);
    return api.post('/memberdetail', data).then(detail);
  },

  // Next member number = branch id + running 5-digit number
  nextMemberNo: async (branchId) => {
    const rows = await api.get(`/last-memberno/${branchId}`).then(detail);
    const last = rows?.[0]?.LastMemberNo;
    if (!last || String(last).trim() === '') return `${branchId}00001`;
    const next = parseInt(String(last).slice(String(branchId).length), 10) + 1;
    return `${branchId}${String(next).padStart(5, '0')}`;
  },
};

export const addressApi = {
  provinces: () => api.get('/address/province').then(detail),
  districts: (provinceName) => api.get('/address/district', { params: { provinceName } }).then(detail),
  munvdcs: (districtName) => api.get('/address/munvdc', { params: { districtName } }).then(detail),
  allDistricts: () => api.get('/address/all-districts').then(detail),
};
