import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { create } from 'domain';
import { Chat, Message, Offer } from 'src/app/models/chat.model';
import { interval, Subscription, throwError } from 'rxjs';
import { catchError, takeWhile } from 'rxjs/operators';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { ChatService } from 'src/app/services/chat.service';
import { ProductService } from 'src/app/services/products.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { Cart } from 'src/app/models/cart.model';

@Component({
  selector: 'app-single-chat',
  templateUrl: './single-chat.component.html',
  styleUrls: ['./single-chat.component.scss']
})
export class SingleChatComponent implements OnInit {
  public product: Product = {} as Product
  public user: User = {} as User
  public users: User[] = []
  public direct: User = {} as User
  public products: Product[] = []
  public chatList: Chat[] = []
  public chat: Chat = {} as Chat
  public messages: Message[] = []
  public loaded = false
  public chatId: string = ''
  public shouldget = true
  public offers: Offer[] = []
  public canChoose = true
  subscription: Subscription | undefined;

  constructor(private readonly transactionService: TransactionService, private chatService: ChatService, private router: Router, private route: ActivatedRoute, private productService: ProductService, private authService: AuthService, private categoryService: CategoryService) {
  }
  ngOnInit() {
   
    this.route.params.subscribe(params => {
      this.authService.getUserByToken(this.authService.getUserCookie()).pipe(
        catchError((error: { status: number; }) => {
          if (error.status === 401) {
         this.router.navigate(['login'])
          }
          return throwError(error);
        })
      ).subscribe((user: User) => {
        this.user = user
        this.productService.getProducts().subscribe(() => {
          this.products = this.productService.productList
          this.chatService.getChat(params['id'], this.authService.getUserCookie(), this.user.id!).subscribe((res: Chat) => {
            this.chat = res
            if (res.emit !== this.user.id && res.recept !== this.user.id) {
              this.router.navigate(['/chat'])
            }
            if (res.emit == this.user.id) {
              this.authService.getUser(res.recept).subscribe((res: User) => {
                this.direct = res
                this.product = this.products.find((prodcut: Product) => prodcut.id == this.chat.product_id)!
                this.loaded = true
                this.suscribirPeticion()
              })
            }
            else {
              this.authService.getUser(res.emit).subscribe((res: User) => {
                this.direct = res
                this.product = this.products.find((prodcut: Product) => prodcut.id == this.chat.product_id)!
                this.loaded = true
                this.suscribirPeticion()
                
              })
            }

          })
        })
      })
    })

  }
  public messageRedirect(msgId: number) {
    const proute = `/chat/${msgId}`
    this.router.navigate([proute])
  }
  public sendMessage() {

    const messageInput = document.getElementById("chat-msg") as HTMLInputElement | null;
    if (messageInput!.value == "") {
      return
    }
    const created = Boolean(this.chat);
    let message: Message = {
      emit: this.user!.id!,
      message: messageInput!.value,
      seen: false,
      created_at: new Date(),
      chat_id: -1
    }
    if (created) {
      this.chatService.getChat(this.chat.id!, this.authService.getUserCookie(), this.user.id!).subscribe((chat: Chat) => {
        this.chat = chat
        message.chat_id = this.chat.id!
        this.shouldget = false
        this.chatService.postMsg(message, this.user.id!, this.authService.getUserCookie()).subscribe(() => {
          this.shouldget = true
          messageInput!.value = ""
        })
      })
    }
  }
  suscribirPeticion(): void {
    this.subscription = interval(600).subscribe(() => {
      this.chatService.getChat(this.chat.id!, this.authService.getUserCookie(), this.user.id!).subscribe((chat: Chat) => {
        if (this.shouldget) {
          this.chat = chat;
          this.chatService.getMsg(this.chat!.id!, this.user.id!, this.authService.getUserCookie()).subscribe((message: Message[]) => {
            this.messages = message
            this.chatService.getOfferById(this.user.id!, this.chat!.id!, this.authService.getUserCookie()).subscribe((offers: any) => {
              this.offers = offers
                const mensajesInvertidos = this.messages.slice().reverse(); 
                const ultimoMensaje = mensajesInvertidos.find((mensaje) => mensaje.emit === this.direct.id);
                if(ultimoMensaje && ultimoMensaje.seen == false) {
                  this.chatService.patchMsg(this.direct.id!,this.authService.getUserCookie(),ultimoMensaje!).subscribe((res) => { })

                }
              
            })
          });
        }
      });
    });
  }
  showOfferPannel() {
    document.getElementById("showPannel")?.classList.remove("displayed")
  }
  hasUserMessage(messages: Message[], userId: number): boolean {
    return messages.some(message => message.emit === userId);
  }
  cancelarSuscripcion(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  showOffer(price: number, offer: Offer) {
    if (offer.emit == this.user.id || offer.state != 0) {
      return
    }
    document.getElementById("offer-sl")!.classList.remove('displayed')
    document.getElementById("offer-price-display")!.innerHTML = `${price}`
    document.getElementById("oId")!.innerHTML = `${offer.id}`

  }
  rejectOffer() {
    this.hideOffer()
    if (this.canChoose == true
    ) {
      this.canChoose = false
      this.chatService.patchOffer(-1, parseInt(document.getElementById("oId")!.innerHTML),this.authService.getUserCookie(),this.user.id!).subscribe(() => {
        this.canChoose = true
      })
    }
  }
  addToCart() {
    this.hideOffer()
    if (this.canChoose == true
    ) {
      this.canChoose = false

      const offerId = parseInt(document.getElementById("oId")!.innerHTML);
      const offer = this.offers.find(oferta => oferta.id === offerId);

      if (offer) {
        this.transactionService.getCart(this.user.id!,this.authService.getUserCookie()).subscribe(() => {
          alert(this.transactionService.cart.id)
          if (this.transactionService.cart.id) {
            this.transactionService.getProductCart(this.transactionService.cart.id, offer, this.product.id!,this.user.id!,this.authService.getUserCookie()).subscribe((res:any) => {
              if (res.id != undefined) {
                this.transactionService.patchProductCart(res.id, offer, this.product.id!,this.authService.getUserCookie(),this.user.id!).subscribe(() => {
                  this.chatService.patchOffer(1, offer.id!,this.authService.getUserCookie(),this.user.id!).subscribe(() => {
                    this.chatService.getOfferById(this.user.id!, this.chat.id!, this.authService.getUserCookie()).subscribe((offers: Offer[]) => {
                      this.offers = offers;
                      this.canChoose = true

                    });
                  });
                });
              } else {
                this.transactionService.postProductCart(offer, this.transactionService.cart.id!, this.product.id!,this.user.id!,this.authService.getUserCookie()).subscribe(() => {
                  this.chatService.patchOffer(1, offer.id!,this.authService.getUserCookie(),this.user.id!).subscribe(() => {
                    this.chatService.getOfferById(this.user.id!, this.chat.id!, this.authService.getUserCookie()).subscribe((offers: Offer[]) => {
                      this.offers = offers;
                      this.canChoose = true

                    });
                  });
                });
              }
            })
          }
          else {
            const newCart = {
              user_id: this.user.id
            } as Cart;
            this.transactionService.postCart(this.user.id!,newCart,this.authService.getUserCookie()).subscribe((createdCart: Cart) => {
              this.transactionService.getCart(this.user.id!,this.authService.getUserCookie())
              this.transactionService.postProductCart(offer, createdCart.id!, this.product.id!,this.user.id!,this.authService.getUserCookie()).subscribe(() => {
                this.chatService.patchOffer(1, offer.id!,this.authService.getUserCookie(),this.user.id!).subscribe(() => {
                  this.chatService.getOfferById(this.user.id!, this.chat.id!, this.authService.getUserCookie()).subscribe((offers: Offer[]) => {
                    this.offers = offers;
                    this.canChoose = true

                  });
                });
              });
            });
          }
        })
      }
    }
  }
  getClassNames(message: Offer): string {
    let classNames = '';
    if (message.state === -1) {
      classNames += 'offer-reject ';
    }
    if (message.state === 1) {
      classNames += 'offer-accept ';
    }
    if (message.emit === this.user.id) {
      classNames += 'message-e ';
    } else {
      classNames += 'message-r ';
    }

    return classNames.trim();
  }
  hideOffer() {
    document.getElementById("offer-sl")!.classList.add('displayed')
  }
  ngOnDestroy(): void {
    this.cancelarSuscripcion();
  }
}
