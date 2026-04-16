<?php

namespace App\Http\Controllers\Art;

use App\Http\Controllers\Controller;
use App\Models\MyGallery;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MyGalleryController extends Controller
{
    public function index()
    {
        $galleries = MyGallery::with(['user', 'media'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (MyGallery $g) => $this->formatGallery($g));

        return Inertia::render('Art/MyGallery/Index', [
            'galleries' => $galleries,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'     => 'required|string|max:255',
            'slug'      => 'nullable|string|max:255|unique:my_galleries,slug',
            'description' => 'nullable|string|max:2000',
            'status'    => ['required', Rule::in(['draft', 'published', 'archived'])],
            'is_public' => 'boolean',
        ]);

        $validated['user_id'] = auth()->id();

        if (empty($validated['slug'])) {
            unset($validated['slug']);
        }

        $gallery = MyGallery::create($validated);

        if ($request->hasFile('cover')) {
            $gallery->addMediaFromRequest('cover')
                ->toMediaCollection('cover');
        }

        return redirect()->back()->with('success', 'Gallery created successfully.');
    }

    public function update(Request $request, MyGallery $myGallery)
    {
        $validated = $request->validate([
            'title'     => 'required|string|max:255',
            'slug'      => ['nullable', 'string', 'max:255', Rule::unique('my_galleries', 'slug')->ignore($myGallery->id)],
            'description' => 'nullable|string|max:2000',
            'status'    => ['required', Rule::in(['draft', 'published', 'archived'])],
            'is_public' => 'boolean',
        ]);

        if (empty($validated['slug'])) {
            unset($validated['slug']);
        }

        $myGallery->update($validated);

        if ($request->hasFile('cover')) {
            $myGallery->clearMediaCollection('cover');
            $myGallery->addMediaFromRequest('cover')
                ->toMediaCollection('cover');
        }

        return redirect()->back()->with('success', 'Gallery updated successfully.');
    }

    public function destroy(MyGallery $myGallery)
    {
        $myGallery->delete();

        return redirect()->back()->with('success', 'Gallery deleted successfully.');
    }

    public function uploadMedia(Request $request, MyGallery $myGallery)
    {
        $request->validate([
            'file'       => 'required|image|max:10240',
            'collection' => ['nullable', Rule::in(['cover', 'images'])],
        ]);

        $collection = $request->input('collection', 'images');

        if ($collection === 'cover') {
            $myGallery->clearMediaCollection('cover');
        }

        $media = $myGallery->addMediaFromRequest('file')
            ->toMediaCollection($collection);

        return response()->json([
            'id'    => $media->id,
            'url'   => $media->getUrl(),
            'thumb' => $media->getUrl('thumb') ?: $media->getUrl(),
            'name'  => $media->file_name,
        ]);
    }

    public function deleteMedia(MyGallery $myGallery, int $mediaId)
    {
        $media = $myGallery->media()->findOrFail($mediaId);
        $media->delete();

        return redirect()->back()->with('success', 'Image deleted successfully.');
    }

    private function formatGallery(MyGallery $gallery): array
    {
        return [
            'id'          => $gallery->id,
            'title'       => $gallery->title,
            'slug'        => $gallery->slug,
            'description' => $gallery->description,
            'status'      => $gallery->status,
            'is_public'   => $gallery->is_public,
            'created_at'  => $gallery->created_at?->toISOString(),
            'updated_at'  => $gallery->updated_at?->toISOString(),
            'deleted_at'  => $gallery->deleted_at?->toISOString(),
            'user'        => [
                'id'   => $gallery->user?->id,
                'name' => $gallery->user?->name,
            ],
            'cover'       => $gallery->getFirstMediaUrl('cover'),
            'cover_thumb' => $gallery->getFirstMediaUrl('cover', 'thumb')
                ?: $gallery->getFirstMediaUrl('cover'),
            'images'      => $gallery->getMedia('images')->map(fn ($m) => [
                'id'    => $m->id,
                'url'   => $m->getUrl(),
                'thumb' => $m->getUrl('thumb') ?: $m->getUrl(),
                'name'  => $m->file_name,
            ]),
            'images_count' => $gallery->getMedia('images')->count(),
        ];
    }
}
