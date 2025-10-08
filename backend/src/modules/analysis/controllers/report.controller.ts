import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { AppError } from '../../../shared/middleware/error-handler.middleware';

export class ReportController {
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        throw new AppError(400, 'start_date and end_date are required');
      }

      // Parse dates in local timezone (São Paulo)
      const startDate = new Date(start_date + 'T00:00:00-03:00');
      const endDate = new Date(end_date + 'T23:59:59-03:00');

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new AppError(400, 'Invalid date format');
      }

      const report = await reportService.generateInflammationReport(
        startDate,
        endDate
      );

      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
