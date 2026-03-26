import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Utils from '../utils/errorUtils';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';
import { Restaurant } from './entities/restaurant.entity';

const defaultRestaurantProfile = {
  name: 'Mesa Viva',
  tagline: 'Sabores que conectan',
  phone: '+56 9 1234 5678',
  email: 'contacto@mesaviva.cl',
  address: 'Av. Costanera 245, Santiago',
  description:
    'Restaurante orientado a una experiencia moderna de sala, pedidos digitales y operacion coordinada entre cliente, cocina y administracion.',
  logoDataUrl: null,
};

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  private async ensureCurrentRestaurant() {
    const existingRestaurant = await this.restaurantRepository.findOne({
      where: {
        state: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    if (existingRestaurant) {
      return existingRestaurant;
    }

    const restaurant = this.restaurantRepository.create(defaultRestaurantProfile);
    return this.restaurantRepository.save(restaurant);
  }

  async findCurrent() {
    try {
      const restaurant = await this.ensureCurrentRestaurant();

      return {
        message: 'Restaurante obtenido exitosamente',
        data: restaurant,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async updateCurrent(updateRestaurantProfileDto: UpdateRestaurantProfileDto) {
    try {
      const restaurant = await this.ensureCurrentRestaurant();

      Object.assign(restaurant, {
        name: updateRestaurantProfileDto.name ?? restaurant.name,
        tagline: updateRestaurantProfileDto.tagline ?? restaurant.tagline,
        phone: updateRestaurantProfileDto.phone ?? restaurant.phone,
        email: updateRestaurantProfileDto.email ?? restaurant.email,
        address: updateRestaurantProfileDto.address ?? restaurant.address,
        description:
          updateRestaurantProfileDto.description ?? restaurant.description,
        logoDataUrl:
          updateRestaurantProfileDto.logoDataUrl !== undefined
            ? updateRestaurantProfileDto.logoDataUrl
            : restaurant.logoDataUrl,
      });

      const updatedRestaurant =
        await this.restaurantRepository.save(restaurant);

      return {
        message: 'Restaurante actualizado exitosamente',
        data: updatedRestaurant,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async resetCurrent() {
    try {
      const restaurant = await this.ensureCurrentRestaurant();

      Object.assign(restaurant, defaultRestaurantProfile);

      const updatedRestaurant =
        await this.restaurantRepository.save(restaurant);

      return {
        message: 'Restaurante restaurado exitosamente',
        data: updatedRestaurant,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
