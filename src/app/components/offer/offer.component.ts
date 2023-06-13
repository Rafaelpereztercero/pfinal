import { Component, Input } from '@angular/core';
import { Offer } from 'src/app/models/chat.model';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-offer',
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.scss']
})
export class OfferComponent {

  @Input() chatId: number | undefined
  @Input() emit: number | undefined
  @Input() productId: number | undefined

  constructor(private readonly chatService: ChatService,private readonly authService:AuthService) {

  }

  displayOfferPannel() {
    document.getElementById("showPannel")?.classList.add("displayed")
  }
  sendOffer() {
    if (this.chatId !== undefined && this.emit !== undefined) {
      const price = <HTMLInputElement>document.getElementById("offer-price")!
      const offerReq: Offer = {
        emit: this.emit,
        price: parseInt(price.value),
        created_at: new Date(),
        state: 0,
        chat_id: this.chatId,
        product_id: this.productId!
      }
      this.chatService.postOffer(offerReq,this.authService.getUserCookie(),this.emit).subscribe(() => {

      })
    }

  }
}
