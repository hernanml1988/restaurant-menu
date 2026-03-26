import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Shield, UserCheck, UserPlus, UserX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  createUserRequest,
  deactivateUserRequest,
  getUserRolesRequest,
  getUsersRequest,
  updateUserRequest,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserRecord,
} from '@/services/userService';

type UserForm = {
  username: string;
  password: string;
  name: string;
  lastname: string;
  secondLastname: string;
  roleId: string;
  state: boolean;
};

const emptyUserForm: UserForm = {
  username: '',
  password: '',
  name: '',
  lastname: '',
  secondLastname: '',
  roleId: '',
  state: true,
};

const roleBadgeClassnames = [
  'bg-primary/10 text-primary',
  'bg-accent/10 text-accent',
  'bg-status-pending/10 text-status-pending',
  'bg-secondary text-secondary-foreground',
  'bg-muted text-foreground',
];

function getInitials(user: UserRecord) {
  const source =
    user.fullName ||
    [user.profile?.name, user.profile?.lastname].filter(Boolean).join(' ') ||
    user.email;

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
  }).format(date);
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getUsersRequest,
  });
  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: getUserRolesRequest,
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const roles = useMemo(
    () => (rolesQuery.data ?? []).filter((role) => role.state),
    [rolesQuery.data],
  );
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      if (!term) {
        return true;
      }

      return (
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.role?.name ?? '').toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  const refreshUsers = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const createUser = useMutation({
    mutationFn: createUserRequest,
    onSuccess: () => {
      refreshUsers();
      setUserDialogOpen(false);
      setEditingUser(null);
      setUserForm(emptyUserForm);
      toast({ title: 'Usuario creado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo crear el usuario',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUserRequest(id, payload),
    onSuccess: () => {
      refreshUsers();
      setUserDialogOpen(false);
      setEditingUser(null);
      setUserForm(emptyUserForm);
      toast({ title: 'Usuario actualizado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo actualizar el usuario',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const deactivateUser = useMutation({
    mutationFn: deactivateUserRequest,
    onSuccess: () => {
      refreshUsers();
      setUserToDelete(null);
      toast({ title: 'Usuario desactivado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo desactivar el usuario',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const openCreateDialog = () => {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setUserDialogOpen(true);
  };

  const openEditDialog = (user: UserRecord) => {
    setEditingUser(user);
    setUserForm({
      username: user.email,
      password: '',
      name: user.profile?.name ?? '',
      lastname: user.profile?.lastname ?? '',
      secondLastname: user.profile?.secondLastname ?? '',
      roleId: user.role?.id ?? '',
      state: user.state,
    });
    setUserDialogOpen(true);
  };

  const submitUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !userForm.username.trim() ||
      !userForm.name.trim() ||
      !userForm.lastname.trim()
    ) {
      toast({
        title: 'Faltan datos',
        description: 'Completa email, nombre y apellido antes de guardar.',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && userForm.password.trim().length < 6) {
      toast({
        title: 'Contrasena invalida',
        description: 'La contrasena debe tener al menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    const basePayload: CreateUserPayload = {
      username: userForm.username.trim(),
      password: userForm.password.trim(),
      name: userForm.name.trim(),
      lastname: userForm.lastname.trim(),
      secondLastname: userForm.secondLastname.trim(),
      state: userForm.state,
      ...(userForm.roleId ? { roleId: userForm.roleId } : {}),
    };

    if (editingUser) {
      const payload: UpdateUserPayload = {
        username: basePayload.username,
        name: basePayload.name,
        lastname: basePayload.lastname,
        secondLastname: basePayload.secondLastname,
        state: basePayload.state,
        ...(basePayload.roleId ? { roleId: basePayload.roleId } : {}),
        ...(userForm.password.trim()
          ? { password: userForm.password.trim() }
          : {}),
      };

      updateUser.mutate({ id: editingUser.id, payload });
      return;
    }

    createUser.mutate(basePayload);
  };

  const loading = usersQuery.isLoading || rolesQuery.isLoading;
  const loadingError = usersQuery.error ?? rolesQuery.error;
  const saving = createUser.isPending || updateUser.isPending;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 font-display text-3xl">Usuarios</h1>
          <p className="text-muted-foreground">
            {users.length} usuarios registrados en el backend
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o rol"
            className="md:w-80"
          />
          <Button onClick={openCreateDialog}>
            <UserPlus className="mr-2 h-4 w-4" /> Nuevo usuario
          </Button>
        </div>
      </div>

      {loadingError && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudieron cargar los usuarios</AlertTitle>
          <AlertDescription>
            {loadingError instanceof Error
              ? loadingError.message
              : 'Verifica la sesion activa y la API.'}
          </AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/30 px-5 py-4">
          <h2 className="font-display text-2xl">Gestion de usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Alta, edicion y desactivacion del personal interno.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Correo
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Rol
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Creado
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Cargando usuarios...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {getInitials(user)}
                        </div>
                        <div>
                          <p className="font-medium">{user.fullName || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{user.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.role ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
                            roleBadgeClassnames[index % roleBadgeClassnames.length]
                          }`}
                        >
                          <Shield className="h-3 w-3" /> {user.role.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin rol</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.state ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                          <UserCheck className="h-3 w-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <UserX className="h-3 w-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-muted"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-muted"
                          onClick={() => setUserToDelete(user)}
                          disabled={!user.state}
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && !filteredUsers.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No hay usuarios para el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={userDialogOpen}
        onOpenChange={(open) => {
          setUserDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setUserForm(emptyUserForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
            <DialogDescription>
              Gestiona correo, perfil y rol del usuario interno.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={submitUser}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-email">Correo</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.username}
                  placeholder="usuario@empresa.com"
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">
                  {editingUser ? 'Nueva contrasena' : 'Contrasena'}
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={userForm.password}
                  placeholder={
                    editingUser ? 'Solo si deseas cambiarla' : 'Minimo 6 caracteres'
                  }
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nombre</Label>
                <Input
                  id="user-name"
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-lastname">Apellido</Label>
                <Input
                  id="user-lastname"
                  value={userForm.lastname}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      lastname: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-second-lastname">Segundo apellido</Label>
                <Input
                  id="user-second-lastname"
                  value={userForm.secondLastname}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      secondLastname: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-role">Rol</Label>
                <select
                  id="user-role"
                  value={userForm.roleId}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      roleId: event.target.value,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sin rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-state">Estado</Label>
                <select
                  id="user-state"
                  value={userForm.state ? 'active' : 'inactive'}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      state: event.target.value === 'active',
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? `Se desactivara ${userToDelete.fullName || userToDelete.email}.`
                : 'Se desactivara el usuario seleccionado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivateUser.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deactivateUser.isPending || !userToDelete}
              onClick={() => userToDelete && deactivateUser.mutate(userToDelete.id)}
            >
              {deactivateUser.isPending ? 'Desactivando...' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
