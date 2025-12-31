import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService';

export const getLedger = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, productId, locationId, startDate, endDate } = req.query;
        const result = await InventoryService.getLedger({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            productId: productId as string,
            locationId: locationId as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getLowStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await InventoryService.getLowStock();
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new Error('Unauthorized');
        const result = await InventoryService.adjustStock({
            ...req.body,
            createdBy: req.user.id,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
