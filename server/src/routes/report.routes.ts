import { Router, Request, Response, NextFunction } from 'express';
import { ReportExportService } from '../services/reportExport.service';
import { requireStaffAuth, requireStaffRole, requireLocationAccess } from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';
import { recordStaffAudit } from '../utils/auditLogger';
import { AnalyticsDatePreset } from '../types/analytics';

const router = Router();

router.use(requireStaffAuth);
router.use(requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER));
router.use(requireLocationAccess('locationId'));

router.get('/export', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reportType = (req.query.reportType as any) || 'sales';
    const locationId = (req.query.locationId as string) || 'loc-colombo-main';
    const preset = req.query.preset as AnalyticsDatePreset | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const validTypes = ['sales', 'orders', 'menu', 'kitchen', 'reservations', 'vip-events', 'activity'];
    if (!validTypes.includes(reportType)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: `Invalid reportType: ${reportType}. Valid types are: ${validTypes.join(', ')}`,
      });
      return;
    }

    const { filename, csvContent } = await ReportExportService.generateCSVReport({
      reportType,
      locationId,
      preset,
      startDate,
      endDate,
    });

    if (req.staff) {
      await recordStaffAudit({
        actorId: req.staff.id,
        actorName: `${req.staff.firstName} ${req.staff.lastName}`,
        actorEmail: req.staff.email,
        targetStaffId: req.staff.id,
        targetStaffName: `${req.staff.firstName} ${req.staff.lastName}`,
        targetStaffEmail: req.staff.email,
        action: 'ANALYTICS_REPORT_EXPORTED',
        details: `Exported ${reportType.toUpperCase()} CSV report for ${locationId}`,
        metadata: { reportType, locationId, preset, startDate, endDate, filename },
        locationId,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

export const reportRoutes = router;
