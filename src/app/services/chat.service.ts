import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { Category } from 'src/app/models/category.model';
import { Chat, Message, Offer } from 'src/app/models/chat.model';
@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly CONFIG_URL = 'http://secondsell.randion.es/api';

  public chatList: Chat[] = []

  constructor(public http: HttpClient) {

  }

  public postChat(chat: Chat, userId: number, token: string): Observable<Chat> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.post<Chat>(`${this.CONFIG_URL}/user/${userId}/chats`, chat, { headers })
  }

  public postOffer(offer: Offer,token:string,userId:number): Observable<Offer> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.post<Offer>(`${this.CONFIG_URL}/user/${userId}/offers`, offer,{headers})
  }

  public patchOffer(state: number, offerId: number,token:string,userId:number): Observable<Message> {
    const patchData: { state: number } = { state: state };
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.patch<Message>(`${this.CONFIG_URL}/user/${userId}/offers/${offerId}`, patchData, {headers});

  }

  public getOfferById(userId: number, offerId: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.get<any>(`${this.CONFIG_URL}/user/${userId}/chats/${offerId}/offers`, { headers })

  }

  public postMsg(message: Message, userId: number, token: string): Observable<Category> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.post<Category>(`${this.CONFIG_URL}/user/${userId}/messages`, message, { headers })
  }

  // FUNCIÓN PARA OBTENER LOS MENSAJES Y ALMACENARLOS EN LA VAR PRIVADA
  public getMsg(msg: number, userId: number, token: string): Observable<Message[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.get<Message[]>(`${this.CONFIG_URL}/user/${userId}/chat/${msg}/messages`, { headers })
  }


  public patchMsg( emit: number,token:string,msg:Message): Observable<any> {
    msg.seen = true
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
   return this.http.patch<Message>(`${this.CONFIG_URL}/user/${emit}/messages/${msg.id}`, msg,{headers});
      
     
  }


  // FUNCIÓN PARA HACER PUT DE UN CHAT
  public putChat(chat: Chat): Observable<Category> {
    return this.http.put<Category>(`${this.CONFIG_URL}/chats/${chat.id}`, chat)
  }

  // FUNCIÓN PARA OBTENER LOS CHATS Y ALMACENARLOS EN LA VAR PRIVADA
  public getChats(userId: number, token: string): Observable<void> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.get<Chat[]>(`${this.CONFIG_URL}/user/${userId}/chats`)
      .pipe(map(((chats: Chat[]) => {
        this.chatList = chats
      })))
  }

  public getUserChats(userId: number, token: string): Observable<Chat[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.get<Chat[]>(`${this.CONFIG_URL}/user/${userId}/chats`, { headers })
  }
  public getChat(id: number, token: string, userId: number): Observable<Chat> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    })
    return this.http.get<Chat>(`${this.CONFIG_URL}/user/${userId}/chats/${id}`, { headers })
  }
}
