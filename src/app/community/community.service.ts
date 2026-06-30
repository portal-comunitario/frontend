import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Event, EventRequest, Post, PostRequest } from './community.models';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.communityApiUrl;

  // ── Posts ──────────────────────────────────────────────

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.base}/posts`);
  }

  createPost(request: PostRequest): Observable<Post> {
    return this.http.post<Post>(`${this.base}/posts`, request);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/posts/${id}`);
  }

  // ── Events ─────────────────────────────────────────────

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.base}/events`);
  }

  createEvent(request: EventRequest): Observable<Event> {
    return this.http.post<Event>(`${this.base}/events`, request);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/events/${id}`);
  }
}
