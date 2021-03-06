import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import {Observable} from "rxjs/Observable";

/*
  Generated class for the Util provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/

declare var $: any;
declare var dateFormat: any;

@Injectable()
export class Util {
  data: any;
  itemMap: any = {};

  constructor(private http: Http
    , private ngZone: NgZone) {
    this.data = null;
  }

  // 리스트를 역순으로 정렬해서 반환한다.
  sortListReverse(_list) {
    _list.sort((a, b) => {
      if (a.dateFormat < b.dateFormat) {
        return 1;
      } else if (a.dateFormat > b.dateFormat) {
        return -1;
      } else {
        return 0;
      }
    });
    return _list;
  }

  // 오브젝트 리스트를 역순으로 정렬해서 반환한다.
  sortObjReverse(_obj) {
    var array = $.map(_obj, function (value, index) {
      return [value];
    });
    return this.sortListReverse(array)
  }

  // 화면에 표출한다.
  show() {
    this.ngZone.run(() => { });
  }

  loadPpomppu(_url, _page) {
    return new Observable(observer => {
      let url = _url + _page;
      this.http.get(url).subscribe(data => {
        let doc = this.getDocFromData(data);
        let elements = doc.querySelectorAll('ul.bbsList .none-border');

        for (var i in elements) {
          if (i == 'length') break;
          let item: any = {};
          item.title = elements[i].querySelector('span.title').textContent.trim();  // 제품명
          let img: any = elements[i].querySelector('div.thmb img');
          if (img) item.imgSrc = img.src; // 이미지
          item.imgSrc = item.imgSrc.replace("http://cache.", "https://");
          item.category = elements[i].querySelector('span.ty').textContent.trim();  // 카테고리
          item.writer = elements[i].querySelector('span.ty_02').textContent.trim(); // 글쓴이
          item.reply = elements[i].querySelector('div.com_line span');
          if (item.reply) item.reply = item.reply.textContent.trim(); //  댓글 수 
          item.good = elements[i].querySelector('span.recom').textContent.trim();;  // 추천
          item.url = "http://m.ppomppu.co.kr/new/" + elements[i].querySelector('a[href]').getAttribute('href');
          item.url = this.removePage(item.url);

          // url
          item.soldOut = elements[i].querySelector('span.title span');

          this.itemMap[item.url] = item;

          this.http.get(item.url).subscribe(data => {
            let item: any = this.itemMap[data.url];
            let doc = this.getDocFromData(data);
            let dateText = doc.querySelector('div.info span.hi').textContent.trim();
            let pattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/;
            let match = pattern.exec(dateText);
            item.dateFormat = this.getDateFormat(match[1]);

            let img: any = doc.querySelector('div.cont img');
            if (img) {
              pattern = /data:image/;
              match = pattern.exec(img.src);
              if (match) item.imgSrc = img.src;
            } 

            observer.next(item);
          });
        }
      });
    });
  }

  // dealbada에서 정보를 가져온다. 
  loadDealbada(_url, _page) {
    return new Observable(observer => {
      let url = _url + _page;
      this.http.get(url).subscribe(data => {
        let doc = this.getDocFromData(data);
        let elements = doc.querySelectorAll('div.tbl_head01 tr');

        for (var i in elements) {
          if (i == 'length') break;
          let a = elements[i].querySelector('td.td_img a');
          let url;
          if (a) url = a.getAttribute('href');
          if (!url) continue;

          this.http.get(url).subscribe(data => {
            let item: any = {};
            item.url = this.removePage(data.url);

            let doc = this.getDocFromData(data);
            let articleSection = doc.querySelector('#bo_v_info');
            // 종료 글인경우에, articleSection이 없다.
            if (!articleSection) return;

            let spans = articleSection.querySelectorAll('div span');
            item.title = spans[0].textContent.trim();
            if (item.title == "블라인드 처리된 게시물입니다") return;

            let dateStr = spans[7].textContent.trim();
            item.dateFormat = this.getDateFormat(dateStr);
            item.read = spans[9].textContent.trim();
            var pattern = /\d+/;
            var match = pattern.exec(item.read);
            if (match) {
              item.good = spans[12].textContent.trim();
              item.bad = spans[15].textContent.trim();
              item.reply = spans[18].textContent.trim();
            } else {
              item.read = spans[10].textContent.trim();
              item.good = spans[13].textContent.trim();
              item.bad = spans[16].textContent.trim();
              item.reply = spans[19].textContent.trim();
            }

            let bodySection = doc.querySelector('#bo_v_con');
            let img;
            img = bodySection.querySelectorAll('img')[0];

            if (img) item.imgSrc = img.src;

            observer.next(item);
          });
        }
      });
    });
  }

  removePage(_url) {    
    return _url.replace(/&page=\d+/g, "");
  }

  getKeyFromUrl(_url) {
    let url = this.removePage(_url);
    let rep = url.replace(/\./g, "_dot_").replace(/\//g, "_slash_");
    return rep;
  }

  getDateFormat(dateStr) {
    dateStr = dateStr.trim();

    let now = new Date();
    let yyyy = now.getFullYear();
    let mm = now.getMonth();
    let dd = now.getDate();
    let hh = now.getHours();
    let mi = now.getMinutes();

    let match: any;
    let pattern: any;

    pattern = /(\d{4}).(\d{2}).(\d{2}) (\d{2}):(\d{2})(:\d{2})?/;  //2016-06-02 13:43
    match = pattern.exec(dateStr);

    if (match) {
      yyyy = match[1];
      mm = match[2] - 1;
      dd = match[3];
      hh = match[4];
      mi = match[5];
    }

    let date = new Date(yyyy, mm, dd, hh, mi);
    return dateFormat(date, "yyyy-mm-dd HH:MM");
  }

  getDocFromData(data) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(data.text(), "text/html");
    return doc;
  }


  load() {
    if (this.data) {
      // already loaded data
      return Promise.resolve(this.data);
    }

    // don't have the data yet
    return new Promise(resolve => {
      // We're using Angular Http provider to request the data,
      // then on the response it'll map the JSON data to a parsed JS object.
      // Next we process the data and resolve the promise with the new data.
      this.http.get('path/to/data.json')
        .map(res => res.json())
        .subscribe(data => {
          // we've got back the raw data, now generate the core schedule data
          // and save the data for later reference
          this.data = data;
          resolve(this.data);
        });
    });
  }
}

