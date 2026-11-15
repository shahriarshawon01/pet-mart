<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /** Browsers revalidate on every request (cheap 304 via ETag), so admin changes show up immediately. */
    public function index(Request $request): JsonResponse
    {
        $response = response()->json(['status' => true, 'data' => Location::publicTree()]);
        $response->setEtag(md5($response->getContent()));
        $response->headers->set('Cache-Control', 'no-cache, private');
        $response->isNotModified($request);

        return $response;
    }
}
