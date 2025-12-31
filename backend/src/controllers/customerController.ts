import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customerService';

export const getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, isActive } = req.query;
        const result = await CustomerService.getAllCustomers({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await CustomerService.getCustomerById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new Error('Unauthorized');
        const customer = await CustomerService.createCustomer(req.body, req.user.id);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await CustomerService.updateCustomer(req.params.id, req.body);
        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await CustomerService.deleteCustomer(req.params.id);
        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
};
