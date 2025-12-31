import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, categoryId, isActive } = req.query;
        const result = await ProductService.getAllProducts({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            categoryId: categoryId as string,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await ProductService.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new Error('Unauthorized');
        const product = await ProductService.createProduct(req.body, req.user.id);
        res.status(201).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await ProductService.updateProduct(req.params.id, req.body);
        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ProductService.deleteProduct(req.params.id);
        res.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new Error('Unauthorized');
        const { productId, quantityChange, type, reason } = req.body;
        const product = await ProductService.updateStock(productId, quantityChange, req.user.id, type, reason);
        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};
