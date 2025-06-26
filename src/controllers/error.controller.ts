import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logError } from '../utils/logger';

// Get all errors from the log file
export const getErrors = async (req: Request, res: Response) => {
  try {
    const logFilePath = path.join(__dirname, '../../logs/error.log');
    
    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      return res.status(200).json({
        message: 'No error log file found',
        errors: []
      });
    }

    // Read the log file
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    
    if (!logContent.trim()) {
      return res.status(200).json({
        message: 'No errors found',
        errors: []
      });
    }

    // Parse each line as JSON (Winston logs each entry as a separate JSON line)
    const errors = logContent
      .trim()
      .split('\n')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          return {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'Failed to parse log entry',
            originalLine: line
          };
        }
      })
      .reverse(); // Show newest errors first

    return res.status(200).json({
      total: errors.length,
      errors
    });
  } catch (error) {
    logError(
      req.method,
      req.params,
      req.query,
      req.body,
      error
    );

    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get errors with pagination
export const getErrorsPaginated = async (req: Request, res: Response) => {
  try {
    let page = parseInt(req.query.page as string);
    let perPage = parseInt(req.query.perPage as string);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(perPage) || perPage < 1) perPage = 10;

    const logFilePath = path.join(__dirname, '../../logs/error.log');
    
    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      return res.status(200).json({
        current_page: page,
        data: [],
        total: 0,
        per_page: perPage,
        last_page: 1,
        from: 0,
        to: 0
      });
    }

    // Read the log file
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    
    if (!logContent.trim()) {
      return res.status(200).json({
        current_page: page,
        data: [],
        total: 0,
        per_page: perPage,
        last_page: 1,
        from: 0,
        to: 0
      });
    }

    // Parse each line as JSON
    const allErrors = logContent
      .trim()
      .split('\n')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          return {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'Failed to parse log entry',
            originalLine: line
          };
        }
      })
      .reverse(); // Show newest errors first

    const total = allErrors.length;
    const lastPage = Math.ceil(total / perPage);
    const from = (page - 1) * perPage;
    const to = Math.min(from + perPage, total);
    const data = allErrors.slice(from, to);

    const baseUrl = req.protocol + '://' + req.get('host') + req.baseUrl + req.path;
    const makePageUrl = (p: number) => `${baseUrl}?page=${p}&perPage=${perPage}`;

    return res.status(200).json({
      current_page: page,
      data,
      first_page_url: makePageUrl(1),
      from: from + 1,
      last_page: lastPage,
      last_page_url: makePageUrl(lastPage),
      next_page_url: page < lastPage ? makePageUrl(page + 1) : null,
      path: baseUrl,
      per_page: perPage,
      prev_page_url: page > 1 ? makePageUrl(page - 1) : null,
      to,
      total
    });
  } catch (error) {
    logError(
      req.method,
      req.params,
      req.query,
      req.body,
      error
    );

    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get error statistics
export const getErrorStats = async (req: Request, res: Response) => {
  try {
    const logFilePath = path.join(__dirname, '../../logs/error.log');
    
    if (!fs.existsSync(logFilePath)) {
      return res.status(200).json({
        total_errors: 0,
        errors_today: 0,
        errors_this_week: 0,
        errors_this_month: 0,
        most_common_errors: []
      });
    }

    const logContent = fs.readFileSync(logFilePath, 'utf8');
    
    if (!logContent.trim()) {
      return res.status(200).json({
        total_errors: 0,
        errors_today: 0,
        errors_this_week: 0,
        errors_this_month: 0,
        most_common_errors: []
      });
    }

    const errors = logContent
      .trim()
      .split('\n')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(error => error !== null);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const errorsToday = errors.filter(error => {
      const errorDate = new Date(error.timestamp);
      return errorDate >= today;
    }).length;

    const errorsThisWeek = errors.filter(error => {
      const errorDate = new Date(error.timestamp);
      return errorDate >= thisWeek;
    }).length;

    const errorsThisMonth = errors.filter(error => {
      const errorDate = new Date(error.timestamp);
      return errorDate >= thisMonth;
    }).length;

    // Count most common error messages
    const errorCounts: { [key: string]: number } = {};
    errors.forEach(error => {
      const message = error.error || error.message || 'Unknown error';
      errorCounts[message] = (errorCounts[message] || 0) + 1;
    });

    const mostCommonErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      total_errors: errors.length,
      errors_today: errorsToday,
      errors_this_week: errorsThisWeek,
      errors_this_month: errorsThisMonth,
      most_common_errors: mostCommonErrors
    });
  } catch (error) {
    logError(
      req.method,
      req.params,
      req.query,
      req.body,
      error
    );

    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
