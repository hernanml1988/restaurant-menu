import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import Utils from '../utils/errorUtils';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private async resolveRestaurant(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, state: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  private async getActiveProductCount(categoryId: string) {
    return this.productRepository.count({
      where: {
        state: true,
        category: {
          id: categoryId,
        },
      },
    });
  }

  private async attachCount(category: Category) {
    category.count = await this.getActiveProductCount(category.id);
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const restaurant = await this.resolveRestaurant(createCategoryDto.restaurantId);

      const duplicatedCategory = await this.categoryRepository.findOne({
        where: {
          restaurant: { id: restaurant.id },
          name: createCategoryDto.name.trim(),
          state: true,
        },
      });

      if (duplicatedCategory) {
        throw new ConflictException('Category already exists');
      }

      const category = this.categoryRepository.create({
        name: createCategoryDto.name.trim(),
        emoji: createCategoryDto.emoji.trim(),
        state: createCategoryDto.state ?? true,
        count: 0,
        restaurant,
      });

      const newCategory = await this.categoryRepository.save(category);

      return {
        message: 'Categoria creada exitosamente',
        data: await this.attachCount(newCategory),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const categories = await this.categoryRepository.find({
        relations: {
          restaurant: true,
        },
        order: {
          name: 'ASC',
        },
      });

      const categoriesWithCount = await Promise.all(
        categories.map((category) => this.attachCount(category)),
      );

      return {
        message: 'Categorias obtenidas exitosamente',
        data: categoriesWithCount,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
        relations: {
          restaurant: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return {
        message: 'Categoria obtenida exitosamente',
        data: await this.attachCount(category),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
        relations: {
          restaurant: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (updateCategoryDto.restaurantId) {
        category.restaurant = await this.resolveRestaurant(updateCategoryDto.restaurantId);
      }

      const nextName = updateCategoryDto.name?.trim();

      if (nextName && nextName !== category.name) {
        const duplicatedCategory = await this.categoryRepository.findOne({
          where: {
            restaurant: { id: category.restaurant.id },
            name: nextName,
            state: true,
          },
        });

        if (duplicatedCategory && duplicatedCategory.id !== category.id) {
          throw new ConflictException('Category already exists');
        }
      }

      Object.assign(category, {
        name: nextName ?? category.name,
        emoji: updateCategoryDto.emoji?.trim() ?? category.emoji,
        state: updateCategoryDto.state ?? category.state,
      });

      const updatedCategory = await this.categoryRepository.save(category);

      return {
        message: 'Categoria actualizada exitosamente',
        data: await this.attachCount(updatedCategory),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async remove(id: string) {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const activeProducts = await this.getActiveProductCount(category.id);

      if (activeProducts > 0) {
        throw new ConflictException(
          'Category has active products and cannot be deleted',
        );
      }

      category.state = false;

      const deletedCategory = await this.categoryRepository.save(category);

      return {
        message: 'Categoria desactivada exitosamente',
        data: await this.attachCount(deletedCategory),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
