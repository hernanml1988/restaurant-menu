import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { StatusEnum } from '../../enums/status.enum';
import { User } from "../../user/entities/user.entity";
import { ProfileRole } from "../../profile_role/entities/profile_role.entity";

@Entity()
export class Profile {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    lastname: string;

    @Column()
    secondLastname: string;

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

    // Relación inversa (opcional, solo si es bidireccional)
    @OneToOne(() => User, (user) => user.profile)
    @JoinColumn() // Esto indica que User es el dueño de la relación (contiene el FK)
    user: User;

    @OneToMany(() => ProfileRole, (profileRole) => profileRole.profile)
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
