import { ChangeEvent, useEffect, useState } from 'react';
import {
  Building2,
  ImagePlus,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
} from 'lucide-react';
import { useRestaurantProfile } from '@/hooks/use-restaurant-profile';
import {
  defaultRestaurantProfile,
  RestaurantProfile,
} from '@/data/restaurantProfile';

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('No se pudo leer el archivo seleccionado.'));
    };

    reader.onerror = () =>
      reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}

export default function AdminMyData() {
  const { profile, updateProfile, resetProfile } = useRestaurantProfile();
  const [form, setForm] = useState<RestaurantProfile>(profile);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleChange =
    (field: keyof RestaurantProfile) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value,
      }));
      setSavedMessage('');
    };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const logoDataUrl = await readFileAsDataUrl(file);

    setForm((currentForm) => ({
      ...currentForm,
      logoDataUrl,
    }));
    setSavedMessage('');
  };

  const handleSave = () => {
    updateProfile(form);
    setSavedMessage('Cambios guardados correctamente.');
  };

  const handleReset = () => {
    resetProfile();
    setForm(defaultRestaurantProfile);
    setSavedMessage('Se restauraron los datos por defecto.');
  };

  const handleRemoveLogo = () => {
    setForm((currentForm) => ({
      ...currentForm,
      logoDataUrl: null,
    }));
    setSavedMessage('');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl mb-1">Mis Datos</h1>
          <p className="text-muted-foreground">
            Configura la informacion base y la identidad visual del restaurante
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 hover:bg-muted active:scale-[0.97]"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
          </button>
          <button
            onClick={handleSave}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.97]"
          >
            <Save className="w-4 h-4" />
            Guardar cambios
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
          {savedMessage}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="bg-card border rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">Informacion general</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Nombre del restaurante
              </span>
              <input
                value={form.name}
                onChange={handleChange('name')}
                className="w-full rounded-xl bg-muted border-0 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Nombre comercial"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium mb-2">Tagline</span>
              <input
                value={form.tagline}
                onChange={handleChange('tagline')}
                className="w-full rounded-xl bg-muted border-0 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Frase principal"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Telefono
              </span>
              <input
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full rounded-xl bg-muted border-0 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="+56 ..."
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Correo
              </span>
              <input
                value={form.email}
                onChange={handleChange('email')}
                className="w-full rounded-xl bg-muted border-0 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="correo@restaurante.com"
              />
            </label>
          </div>

          <label className="block mt-4">
            <span className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Direccion
            </span>
            <input
              value={form.address}
              onChange={handleChange('address')}
              className="w-full rounded-xl bg-muted border-0 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Direccion del local"
            />
          </label>

          <label className="block mt-4">
            <span className="text-sm font-medium mb-2">Descripcion</span>
            <textarea
              value={form.description}
              onChange={handleChange('description')}
              rows={5}
              className="w-full rounded-2xl bg-muted border-0 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Describe la propuesta del restaurante"
            />
          </label>
        </section>

        <section className="bg-card border rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">Logo y vista previa</h2>

          <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-6 text-center">
            <div className="w-28 h-28 mx-auto rounded-3xl bg-card border overflow-hidden flex items-center justify-center shadow-sm">
              {form.logoDataUrl ? (
                <img
                  src={form.logoDataUrl}
                  alt={form.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center px-3">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Sin logo cargado</span>
                </div>
              )}
            </div>

            <h3 className="font-display text-2xl mt-4">{form.name || 'Nombre del restaurante'}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {form.tagline || 'Tagline del restaurante'}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-5">
              <label className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 active:scale-[0.97]">
                <ImagePlus className="w-4 h-4" />
                Subir logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleRemoveLogo}
                className="px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted active:scale-[0.97]"
              >
                Quitar logo
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-sidebar text-sidebar-foreground p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/50 mb-3">
              Resumen
            </p>
            <div className="space-y-3 text-sm">
              <p>{form.phone}</p>
              <p>{form.email}</p>
              <p>{form.address}</p>
              <p className="text-sidebar-foreground/70 leading-relaxed">{form.description}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
