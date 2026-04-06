import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { RestaurantService } from '../restaurant/restaurant.service';
import Utils from '../utils/errorUtils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductExtra)
    private readonly productExtraRepository: Repository<ProductExtra>,
    private readonly restaurantService: RestaurantService,
  ) {}

  private sanitizeOptionalText(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    const sanitized = value?.trim();
    return sanitized ? sanitized : null;
  }

  private sanitizeAllergens(allergens?: string[]) {
    if (!allergens) {
      return undefined;
    }

    return allergens
      .map((allergen) => allergen.trim())
      .filter(Boolean);
  }

  private async resolveRestaurant(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, state: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  private async resolveCategory(categoryId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, state: true },
      relations: {
        restaurant: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async ensureUniqueProductName(
    restaurantId: string,
    name: string,
    currentProductId?: string,
  ) {
    const duplicatedProduct = await this.productRepository.findOne({
      where: {
        restaurant: { id: restaurantId },
        name,
        state: true,
      },
      relations: {
        restaurant: true,
      },
    });

    if (duplicatedProduct && duplicatedProduct.id !== currentProductId) {
      throw new ConflictException('Product already exists');
    }
  }

  private async syncCategoryCount(categoryId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      return;
    }

    category.count = await this.productRepository.count({
      where: {
        state: true,
        category: {
          id: categoryId,
        },
      },
    });

    await this.categoryRepository.save(category);
  }

  private async attachRelations(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: {
        restaurant: true,
        category: true,
        extras: true,
      },
      order: {
        extras: {
          name: 'ASC',
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const restaurant = await this.resolveRestaurant(createProductDto.restaurantId);
      const category = await this.resolveCategory(createProductDto.categoryId);

      if (category.restaurant.id !== restaurant.id) {
        throw new ConflictException('Category does not belong to restaurant');
      }

      const nextName = createProductDto.name.trim();

      await this.ensureUniqueProductName(restaurant.id, nextName);

      const product = this.productRepository.create({
        name: nextName,
        description: createProductDto.description.trim(),
        price: createProductDto.price,
        image: this.sanitizeOptionalText(createProductDto.image),
        gradient: this.sanitizeOptionalText(createProductDto.gradient),
        available: createProductDto.available ?? true,
        popular: createProductDto.popular ?? false,
        promo: createProductDto.promo ?? false,
        trackStock: createProductDto.trackStock ?? false,
        stockQuantity: createProductDto.stockQuantity ?? 0,
        stockAlertThreshold: createProductDto.stockAlertThreshold ?? 0,
        allergens: this.sanitizeAllergens(createProductDto.allergens) ?? [],
        state: createProductDto.state ?? true,
        restaurant,
        category,
      });

      if (product.trackStock && product.stockQuantity <= 0) {
        product.available = false;
      }

      const newProduct = await this.productRepository.save(product);
      await this.syncCategoryCount(category.id);

      return {
        message: 'Producto creado exitosamente',
        data: await this.attachRelations(newProduct.id),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findPublicAll() {
    try {
      const restaurant = await this.restaurantService.getCurrentRestaurantEntity();
      const products = await this.productRepository.find({
        where: {
          restaurant: { id: restaurant.id },
          state: true,
          category: {
            state: true,
          },
        },
        relations: {
          restaurant: true,
          category: true,
          extras: true,
        },
        order: {
          name: 'ASC',
          extras: {
            name: 'ASC',
          },
        },
      });

      return {
        message: 'Productos publicos obtenidos exitosamente',
        data: products,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const products = await this.productRepository.find({
        relations: {
          restaurant: true,
          category: true,
          extras: true,
        },
        order: {
          name: 'ASC',
          extras: {
            name: 'ASC',
          },
        },
      });

      return {
        message: 'Productos obtenidos exitosamente',
        data: products,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.attachRelations(id);

      return {
        message: 'Producto obtenido exitosamente',
        data: product,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findPublicOne(id: string) {
    try {
      const restaurant = await this.restaurantService.getCurrentRestaurantEntity();
      const product = await this.productRepository.findOne({
        where: {
          id,
          restaurant: { id: restaurant.id },
          state: true,
          category: {
            state: true,
          },
        },
        relations: {
          restaurant: true,
          category: true,
          extras: true,
        },
        order: {
          extras: {
            name: 'ASC',
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return {
        message: 'Producto publico obtenido exitosamente',
        data: product,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productRepository.findOne({
        where: { id },
        relations: {
          restaurant: true,
          category: true,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const previousCategoryId = product.category.id;

      if (updateProductDto.restaurantId) {
        product.restaurant = await this.resolveRestaurant(updateProductDto.restaurantId);
      }

      if (updateProductDto.categoryId) {
        const category = await this.resolveCategory(updateProductDto.categoryId);

        if (category.restaurant.id !== product.restaurant.id) {
          throw new ConflictException('Category does not belong to restaurant');
        }

        product.category = category;
      }

      const nextName = updateProductDto.name?.trim();

      if (nextName && nextName !== product.name) {
        await this.ensureUniqueProductName(
          product.restaurant.id,
          nextName,
          product.id,
        );
      }

      Object.assign(product, {
        name: nextName ?? product.name,
        description: updateProductDto.description?.trim() ?? product.description,
        price: updateProductDto.price ?? product.price,
        available: updateProductDto.available ?? product.available,
        popular: updateProductDto.popular ?? product.popular,
        promo: updateProductDto.promo ?? product.promo,
        trackStock: updateProductDto.trackStock ?? product.trackStock,
        stockQuantity: updateProductDto.stockQuantity ?? product.stockQuantity,
        stockAlertThreshold:
          updateProductDto.stockAlertThreshold ?? product.stockAlertThreshold,
        state: updateProductDto.state ?? product.state,
      });

      if (product.trackStock && product.stockQuantity <= 0) {
        product.available = false;
      }

      const nextImage = this.sanitizeOptionalText(updateProductDto.image);
      if (nextImage !== undefined) {
        product.image = nextImage;
      }

      const nextGradient = this.sanitizeOptionalText(updateProductDto.gradient);
      if (nextGradient !== undefined) {
        product.gradient = nextGradient;
      }

      const nextAllergens = this.sanitizeAllergens(updateProductDto.allergens);
      if (nextAllergens !== undefined) {
        product.allergens = nextAllergens;
      }

      const updatedProduct = await this.productRepository.save(product);

      await this.syncCategoryCount(previousCategoryId);
      await this.syncCategoryCount(updatedProduct.category.id);

      return {
        message: 'Producto actualizado exitosamente',
        data: await this.attachRelations(updatedProduct.id),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async remove(id: string) {
    try {
      const product = await this.productRepository.findOne({
        where: { id },
        relations: {
          category: true,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const activeExtras = await this.productExtraRepository.count({
        where: {
          product: { id: product.id },
          state: true,
        },
      });

      if (activeExtras > 0) {
        throw new ConflictException(
          'Product has active extras and cannot be deleted',
        );
      }

      product.state = false;

      const deletedProduct = await this.productRepository.save(product);
      await this.syncCategoryCount(product.category.id);

      return {
        message: 'Producto desactivado exitosamente',
        data: await this.attachRelations(deletedProduct.id),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
