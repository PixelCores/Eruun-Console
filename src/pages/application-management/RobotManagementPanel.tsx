import { useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import useSWR from 'swr';
import {
  createPurchaserRobot,
  deletePurchaserRobots,
  exportPurchaserRobots,
  getPurchaserRobots,
  importPurchaserRobots,
  updatePurchaserRobot,
  type PurchaserProduct,
  type PurchaserRobot,
  type PurchaserRobotListResponse,
} from '../../api/paasBilling';
import ConfirmDialog from '../../components/base/ConfirmDialog';
import Modal from '../../components/base/Modal';
import Input from '../../components/base/Input';
import { Button } from '../../components/ui/Button';

const ROBOT_PAGE_SIZES = [20, 40, 100] as const;
const MAX_IMPORT_SIZE = 10 * 1024 * 1024;

type RobotFilter = -1 | 0 | 1;

type RobotListKey = readonly [
  'application-management-robots',
  string,
  number,
  number,
  number,
  RobotFilter,
];

interface RobotManagementPanelProps {
  accessToken: string;
  product: PurchaserProduct;
  purchaserUri: string;
}

interface RobotForm {
  nickName: string;
  avatar: string;
}

const EMPTY_FORM: RobotForm = { nickName: '', avatar: '' };

const isAbsoluteHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const downloadBase64File = (fileName: string, contentType: string, content: string) => {
  const bytes = Uint8Array.from(atob(content), (character) => character.charCodeAt(0));
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: contentType || 'text/csv' }));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName || 'robots.csv';
  link.click();
  URL.revokeObjectURL(objectUrl);
};

const RobotManagementPanel = ({
  accessToken,
  product,
  purchaserUri,
}: RobotManagementPanelProps) => {
  const t = useTranslations('ApplicationManagement');
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<RobotFilter>(-1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof ROBOT_PAGE_SIZES)[number]>(20);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [editingRobot, setEditingRobot] = useState<PurchaserRobot | null>(null);
  const [isRobotModalOpen, setRobotModalOpen] = useState(false);
  const [form, setForm] = useState<RobotForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [isExporting, setExporting] = useState(false);
  const [isImporting, setImporting] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[] | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<PurchaserRobotListResponse>(
    [
      'application-management-robots',
      accessToken,
      product.id,
      page,
      pageSize,
      filter,
    ] as const,
    (key) => {
      const [, token, productId, currentPage, currentPageSize, currentFilter] =
        key as RobotListKey;
      return getPurchaserRobots(token, {
        productId,
        page: currentPage,
        pageSize: currentPageSize,
        env: product.env,
        isCrossDomain: currentFilter,
      });
    },
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  const robots = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);
  const total = Number.isFinite(data?.total) ? Number(data?.total) : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPageIds = useMemo(() => robots.map((robot) => robot.id), [robots]);
  const isCurrentPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));

  const clearFeedback = () => {
    setActionError('');
    setActionMessage('');
  };

  const handleFilterChange = (value: RobotFilter) => {
    setFilter(value);
    setPage(1);
    setSelectedIds(new Set());
    clearFeedback();
  };

  const handlePageSizeChange = (value: number) => {
    const nextPageSize = ROBOT_PAGE_SIZES.find((size) => size === value) ?? 20;
    setPageSize(nextPageSize);
    setPage(1);
    clearFeedback();
  };

  const toggleCurrentPage = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      currentPageIds.forEach((id) => {
        if (isCurrentPageSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const toggleRobot = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingRobot(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setRobotModalOpen(true);
  };

  const openEditModal = (robot: PurchaserRobot) => {
    setEditingRobot(robot);
    setForm({ nickName: robot.nickName, avatar: robot.avatar });
    setFormError('');
    setRobotModalOpen(true);
  };

  const closeRobotModal = () => {
    if (isSaving) return;
    setRobotModalOpen(false);
    setEditingRobot(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const saveRobot = async () => {
    const nickName = form.nickName.trim();
    const avatar = form.avatar.trim();
    if (!purchaserUri) {
      setFormError(t('missingPurchaserUri'));
      return;
    }
    if (!nickName) {
      setFormError(t('robotNameRequired'));
      return;
    }
    if (!isAbsoluteHttpUrl(avatar)) {
      setFormError(t('robotAvatarInvalid'));
      return;
    }

    setSaving(true);
    setFormError('');
    clearFeedback();
    try {
      const request = {
        nickName,
        avatar,
        productId: product.id,
        uri: purchaserUri,
        env: product.env,
      };
      if (editingRobot) {
        await updatePurchaserRobot(accessToken, { ...request, id: editingRobot.id });
      } else {
        await createPurchaserRobot(accessToken, request);
      }
      await mutate();
      setActionMessage(t(editingRobot ? 'robotUpdated' : 'robotCreated'));
      setRobotModalOpen(false);
      setEditingRobot(null);
      setForm(EMPTY_FORM);
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? caughtError.message : t('actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteRobots = (ids: number[]) => {
    if (!purchaserUri) {
      setActionError(t('missingPurchaserUri'));
      return;
    }
    if (ids.length === 0) return;
    setDeleteError('');
    setPendingDeleteIds(ids);
  };

  const confirmDeleteRobots = async () => {
    if (!pendingDeleteIds || pendingDeleteIds.length === 0) return;
    const ids = pendingDeleteIds;
    setDeleting(true);
    setDeleteError('');
    clearFeedback();
    try {
      await deletePurchaserRobots(accessToken, {
        ids,
        productId: product.id,
        uri: purchaserUri,
      });
    } catch (caughtError) {
      setDeleteError(caughtError instanceof Error ? caughtError.message : t('actionFailed'));
      setDeleting(false);
      return;
    }

    setPendingDeleteIds(null);
    setSelectedIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setActionMessage(t('robotsDeleted', { count: ids.length }));
    try {
      if (robots.length <= ids.filter((id) => currentPageIds.includes(id)).length && page > 1) {
        setPage((current) => current - 1);
      } else {
        await mutate();
      }
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : t('actionFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const exportRobots = async () => {
    if (selectedIds.size === 0) {
      setActionError(t('selectRobotsToExport'));
      return;
    }

    setExporting(true);
    clearFeedback();
    try {
      const response = await exportPurchaserRobots(
        accessToken,
        product.id,
        Array.from(selectedIds),
      );
      downloadBase64File(response.fileName, response.contentType, response.contentBase64);
      setActionMessage(t('robotsExported', { count: selectedIds.size }));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : t('actionFailed'));
    } finally {
      setExporting(false);
    }
  };

  const importRobots = async (file: File | undefined) => {
    if (!file) return;
    if (!purchaserUri) {
      setActionError(t('missingPurchaserUri'));
      return;
    }
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setActionError(t('robotImportTypeError'));
      return;
    }
    if (file.size > MAX_IMPORT_SIZE) {
      setActionError(t('robotImportSizeError'));
      return;
    }

    setImporting(true);
    clearFeedback();
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('productId', String(product.id));
      body.set('uri', purchaserUri);
      body.set('env', product.env);
      const response = await importPurchaserRobots(accessToken, body);
      await mutate();
      setActionMessage(t('robotsImported', {
        fileCount: response.fileCount,
        actualCount: response.actualCount,
      }));
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : t('actionFailed'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return t('unavailable');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('unavailable');
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 lg:px-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t('robotManagement')}</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">{t('robotManagementDescription')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="small" variant="secondary" onClick={openCreateModal}>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t('createRobot')}
            </span>
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={isImporting}
          >
            <span className="inline-flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {t('importRobots')}
            </span>
          </Button>
          <a
            href="/robot-import-template.xlsx"
            download
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            {t('downloadTemplate')}
          </a>
          <Button
            size="small"
            variant="secondary"
            onClick={() => void exportRobots()}
            loading={isExporting}
          >
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {t('exportSelected')}
            </span>
          </Button>
          <Button
            size="small"
            variant="warning"
            disabled={selectedIds.size === 0}
            onClick={() => requestDeleteRobots(Array.from(selectedIds))}
          >
            <span className="inline-flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('deleteSelected')}
            </span>
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(event) => void importRobots(event.target.files?.[0])}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
          {t('crossDomainFilter')}
          <select
            value={filter}
            onChange={(event) => handleFilterChange(Number(event.target.value) as RobotFilter)}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={-1}>{t('allRobots')}</option>
            <option value={1}>{t('crossDomain')}</option>
            <option value={0}>{t('sameDomain')}</option>
          </select>
        </label>
        <p className="text-xs text-gray-500">
          {t('selectedRobots', { selected: selectedIds.size, total })}
        </p>
      </div>

      {(actionError || actionMessage) && (
        <div
          role={actionError ? 'alert' : 'status'}
          className={`mx-4 mb-3 rounded-lg px-3 py-2 text-xs lg:mx-6 ${
            actionError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {actionError || actionMessage}
        </div>
      )}

      <div className="overflow-x-auto border-y border-gray-100">
        <table className="min-w-[760px] w-full border-collapse text-left text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="w-12 px-4 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={isCurrentPageSelected}
                  onChange={toggleCurrentPage}
                  aria-label={t('selectCurrentPage')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-3 py-3 font-medium">{t('robot')}</th>
              <th className="px-3 py-3 font-medium">{t('avatarUrl')}</th>
              <th className="px-3 py-3 font-medium">{t('updatedAt')}</th>
              <th className="px-3 py-3 font-medium">{t('domainMode')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  {t('loadingRobots')}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="text-red-600">{t('robotsLoadError')}</p>
                  <button
                    type="button"
                    onClick={() => void mutate()}
                    className="mt-2 font-medium text-blue-600 hover:text-blue-700"
                  >
                    {t('retry')}
                  </button>
                </td>
              </tr>
            ) : robots.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  {t('noRobots')}
                </td>
              </tr>
            ) : (
              robots.map((robot) => (
                <tr key={robot.id} className="text-gray-700 hover:bg-gray-50/70">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(robot.id)}
                      onChange={() => toggleRobot(robot.id)}
                      aria-label={t('selectRobot', { name: robot.nickName })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={robot.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                      />
                      <span className="max-w-40 truncate font-medium text-gray-900">
                        {robot.nickName}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-64 truncate px-3 py-3 text-gray-500" title={robot.avatar}>
                    {robot.avatar}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                    {formatDate(robot.updatedAt)}
                  </td>
                  <td className="px-3 py-3">
                    {robot.isCrossDomain ? t('crossDomain') : t('sameDomain')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(robot)}
                        aria-label={t('editRobot', { name: robot.nickName })}
                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDeleteRobots([robot.id])}
                        aria-label={t('deleteRobot', { name: robot.nickName })}
                        className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
        <label className="flex items-center gap-2 text-xs text-gray-500">
          {t('rowsPerPage')}
          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700"
          >
            {ROBOT_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{t('pageOf', { page, total: totalPages })}</span>
          <Button
            size="small"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            {t('previous')}
          </Button>
          <Button
            size="small"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('next')}
          </Button>
        </div>
      </div>

      <Modal
        isShow={isRobotModalOpen}
        onClose={closeRobotModal}
        closeLabel={t('close')}
        title={t(editingRobot ? 'editRobotTitle' : 'createRobotTitle')}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">
              {t('robotName')}
            </span>
            <Input
              value={form.nickName}
              maxLength={64}
              onChange={(event) => setForm((current) => ({
                ...current,
                nickName: event.target.value,
              }))}
              placeholder={t('robotNamePlaceholder')}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">
              {t('avatarUrl')}
            </span>
            <Input
              value={form.avatar}
              onChange={(event) => setForm((current) => ({
                ...current,
                avatar: event.target.value,
              }))}
              placeholder="https://example.com/avatar.png"
            />
          </label>
          {formError && <p role="alert" className="text-xs text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeRobotModal}>{t('cancel')}</Button>
            <Button loading={isSaving} onClick={() => void saveRobot()}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={pendingDeleteIds !== null}
        title={t('deleteRobotsTitle')}
        description={t('confirmDeleteRobots', { count: pendingDeleteIds?.length ?? 0 })}
        confirmLabel={isDeleting ? t('deleting') : t('deleteRobots')}
        cancelLabel={t('cancel')}
        tone="destructive"
        loading={isDeleting}
        error={deleteError}
        onConfirm={() => void confirmDeleteRobots()}
        onCancel={() => {
          if (isDeleting) return;
          setPendingDeleteIds(null);
          setDeleteError('');
        }}
      />
    </div>
  );
};

export default RobotManagementPanel;
