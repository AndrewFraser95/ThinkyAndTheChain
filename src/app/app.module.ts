import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatSelectModule,
    MatButtonModule
  ],
  providers: [    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'fill'}}
],
  bootstrap: [AppComponent]
})
export class AppModule { }
