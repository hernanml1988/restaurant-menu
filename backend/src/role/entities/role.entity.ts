import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { StatusEnum } from '../../enums/status.enum';
import { ProfileRole } from "../../profile_role/entities/profile_role.entity";

@Entity()
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true })
    description: string;

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

    @OneToMany(() => ProfileRole, (profileRole) => profileRole.role)
    profileRoles: ProfileRole[];

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
