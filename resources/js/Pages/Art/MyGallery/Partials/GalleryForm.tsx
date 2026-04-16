import { useForm, router } from '@inertiajs/react'
import { useTranslation } from '@/lib/i18n'
import { MyGallery, GalleryImage } from '@/types'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Textarea } from '@/Components/ui/textarea'
import { Switch } from '@/Components/ui/switch'
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/Components/ui/select'
import {
    Field, FieldGroup, FieldLabel, FieldError, FieldDescription,
} from '@/Components/ui/field'
import { Separator } from '@/Components/ui/separator'
import { X, Image as ImageIcon, Globe, Lock, Upload, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface GalleryFormProps {
    gallery?: MyGallery | null
    onSuccess?: () => void
}

export default function GalleryForm({ gallery, onSuccess }: GalleryFormProps) {
    const { t } = useTranslation()
    const [coverPreview, setCoverPreview] = useState<string>(gallery?.cover || '')
    const coverInputRef = useRef<HTMLInputElement>(null)
    const coverFileRef = useRef<File | null>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(gallery?.images ?? [])
    const [uploadingImages, setUploadingImages] = useState(false)

    const { data, setData, errors, processing, reset } = useForm({
        title:       gallery?.title ?? '',
        slug:        gallery?.slug ?? '',
        description: gallery?.description ?? '',
        status:      (gallery?.status ?? 'draft') as 'draft' | 'published' | 'archived',
        is_public:   gallery?.is_public ?? true,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const formData = new FormData()
        formData.append('title',       data.title)
        formData.append('slug',        data.slug)
        formData.append('description', data.description)
        formData.append('status',      data.status)
        formData.append('is_public',   data.is_public ? '1' : '0')
        if (coverFileRef.current) {
            formData.append('cover', coverFileRef.current)
        }

        if (gallery) {
            formData.append('_method', 'PUT')
            router.post(route('my-gallery.update', gallery.id), formData, {
                onSuccess: () => { reset(); onSuccess?.() },
                forceFormData: true,
            })
        } else {
            router.post(route('my-gallery.store'), formData, {
                onSuccess: () => {
                    reset()
                    coverFileRef.current = null
                    setCoverPreview('')
                    onSuccess?.()
                },
                forceFormData: true,
            })
        }
    }

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        coverFileRef.current = file
        const reader = new FileReader()
        reader.onload = (ev) => setCoverPreview(ev.target?.result as string)
        reader.readAsDataURL(file)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!gallery || !e.target.files?.length) return
        setUploadingImages(true)

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''

        for (const file of Array.from(e.target.files)) {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('collection', 'images')

            try {
                const res = await fetch(route('my-gallery.media.upload', gallery.id), {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                    credentials: 'same-origin',
                    body: fd,
                })
                if (res.ok) {
                    const data = await res.json()
                    setGalleryImages(prev => [...prev, data])
                }
            } catch {
                // silently skip failed uploads
            }
        }

        setUploadingImages(false)
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    const handleDeleteImage = (imageId: number) => {
        if (!gallery) return
        router.delete(route('my-gallery.media.delete', [gallery.id, imageId]), {
            preserveScroll: true,
            onSuccess: () => {
                setGalleryImages(prev => prev.filter(img => img.id !== imageId))
            },
        })
    }

    return (
        <form onSubmit={handleSubmit}>
            <FieldGroup>

                {/* Title */}
                <Field data-invalid={!!errors.title || undefined}>
                    <FieldLabel htmlFor="title">{t('Title')} <span className="text-destructive">*</span></FieldLabel>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={e => setData('title', e.target.value)}
                        placeholder={t('Gallery title')}
                        aria-invalid={!!errors.title || undefined}
                        autoFocus
                    />
                    {errors.title && <FieldError>{errors.title}</FieldError>}
                </Field>

                {/* Slug */}
                <Field data-invalid={!!errors.slug || undefined}>
                    <FieldLabel htmlFor="slug">
                        {t('Slug')}
                        <span className="text-xs text-muted-foreground font-normal">({t('auto-generated-from-title')})</span>
                    </FieldLabel>
                    <Input
                        id="slug"
                        value={data.slug}
                        onChange={e => setData('slug', e.target.value)}
                        placeholder="npr. moja-prva-galerija"
                        aria-invalid={!!errors.slug || undefined}
                        className="font-mono text-sm"
                    />
                    {errors.slug && <FieldError>{errors.slug}</FieldError>}
                </Field>

                {/* Status */}
                <Field data-invalid={!!errors.status || undefined}>
                    <FieldLabel>{t('Status')}</FieldLabel>
                    <Select value={data.status} onValueChange={v => setData('status', v as typeof data.status)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="draft">
                                    <span className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-yellow-400 inline-block" />
                                        {t('Draft')}
                                    </span>
                                </SelectItem>
                                <SelectItem value="published">
                                    <span className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-green-500 inline-block" />
                                        {t('Published')}
                                    </span>
                                </SelectItem>
                                <SelectItem value="archived">
                                    <span className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-gray-400 inline-block" />
                                        {t('Archived')}
                                    </span>
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {errors.status && <FieldError>{errors.status}</FieldError>}
                </Field>

                {/* Public access */}
                <Field orientation="horizontal">
                    <div className="flex flex-col gap-0.5">
                        <FieldLabel className="text-sm font-medium">{t('Public access')}</FieldLabel>
                        <FieldDescription>
                            {data.is_public
                                ? t('Visible without login')
                                : t('Requires login')}
                        </FieldDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {data.is_public
                            ? <Globe className="size-4 text-green-600 dark:text-green-400" />
                            : <Lock className="size-4 text-orange-600 dark:text-orange-400" />}
                        <Switch
                            checked={data.is_public}
                            onCheckedChange={v => setData('is_public', v)}
                        />
                    </div>
                </Field>

                {/* Cover image */}
                <Field>
                    <FieldLabel>{t('Cover image')}</FieldLabel>
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                            "hover:border-primary/50",
                            coverPreview ? "p-2" : "p-6"
                        )}
                        onClick={() => coverInputRef.current?.click()}
                    >
                        {coverPreview ? (
                            <div className="relative">
                                <img
                                    src={coverPreview}
                                    alt=""
                                    className="max-h-52 w-full rounded object-cover"
                                />
                                <button
                                    type="button"
                                    className="absolute top-2 right-2 bg-background/90 rounded-full p-1 shadow hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                    onClick={e => {
                                        e.stopPropagation()
                                        setCoverPreview('')
                                        coverFileRef.current = null
                                        if (coverInputRef.current) coverInputRef.current.value = ''
                                    }}
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageIcon className="size-10 opacity-40" />
                                <span className="text-sm">{t('Click to upload cover image')}</span>
                                <span className="text-xs opacity-60">JPG, PNG, WEBP</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleCoverChange}
                    />
                    {errors.cover && <FieldError>{errors.cover}</FieldError>}
                </Field>

                {/* Description */}
                <Field data-invalid={!!errors.description || undefined}>
                    <FieldLabel htmlFor="description">{t('Description')}</FieldLabel>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        placeholder={t('Short description of the gallery')}
                        rows={3}
                        aria-invalid={!!errors.description || undefined}
                        className="resize-none"
                    />
                    {errors.description && <FieldError>{errors.description}</FieldError>}
                </Field>

                {/* Gallery images (only for existing galleries) */}
                {gallery && (
                    <Field>
                        <div className="flex items-center justify-between">
                            <FieldLabel>{t('Gallery images')}</FieldLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingImages}
                                onClick={() => imageInputRef.current?.click()}
                            >
                                <Upload data-icon="inline-start" />
                                {uploadingImages ? t('Uploading...') : t('Upload images')}
                            </Button>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>

                        {galleryImages.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {galleryImages.map(img => (
                                    <div key={img.id} className="relative group rounded-lg overflow-hidden">
                                        <img
                                            src={img.thumb}
                                            alt={img.name}
                                            className="w-full aspect-square object-cover"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                            onClick={() => handleDeleteImage(img.id)}
                                        >
                                            <Trash2 className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground">
                                <ImageIcon className="size-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{t('No images in this gallery yet.')}</p>
                                <p className="text-xs opacity-60 mt-1">{t('Use the upload button to add images')}</p>
                            </div>
                        )}
                    </Field>
                )}

                {!gallery && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        <ImageIcon className="size-6 mx-auto mb-1 opacity-40" />
                        {t('Save the gallery first, then you can upload images.')}
                    </div>
                )}

                {/* Submit */}
                <Separator />
                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={processing} className="min-w-28">
                        {processing
                            ? t('Saving...')
                            : gallery
                                ? t('Update Gallery')
                                : t('Create Gallery')}
                    </Button>
                </div>
            </FieldGroup>
        </form>
    )
}
