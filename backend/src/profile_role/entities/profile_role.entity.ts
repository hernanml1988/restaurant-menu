import { Role } from '../../role/entities/role.entity';
import { StatusEnum } from '../../enums/status.enum';
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Profile } from '../../profile/entities/profile.entity';

@Entity()
export class ProfileRole {
    @PrimaryGeneratedColumn('uuid')
        id: string;
    
        @Column({ default: true })
        state: boolean;
    
        @Column({ default: StatusEnum.ACTIVE })
        status: string;
    
        @Column()
        createdAt: Date;
    
        @Column()
        updatedAt: Date;
    
        @Column({ nullable: true, default: null })
        deletedAt: Date;
    
        @Column()
        createdBy: string;
    
        @Column()
        modifiedBy: string;

        //relaciones
     
        @ManyToOne(() => Role, (role) => role.profileRoles)
        role: Role;

        @ManyToOne(() => Profile, (profile) => profile.profileRoles)
        profile: Profile;
  

    //fin relaciones 
    
     //funciones
        @BeforeInsert()
        createCreatedBy() {
            if (!this.createdBy) {
                this.createdBy = 'system0';
            }
        }
    
        @BeforeInsert()
        createModifiedBy() {
            if (!this.modifiedBy) {
                this.modifiedBy = 'system01';
            }
        }
    
        @BeforeInsert()
        generateDates() {
            this.createdAt = new Date();
            this.updatedAt = new Date();
        }
    
        @BeforeUpdate()
        generateUpdateAt() {
            this.updatedAt = new Date();
        }
         //fin funciones
}
