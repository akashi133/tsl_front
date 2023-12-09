/*
* для формы добавления объявления об авто
*/

import { Controller } from "@hotwired/stimulus"
import $ from "jquery"
import bootstrap from 'bootstrap'
import 'select2/dist/js/select2.min'
import 'select2/dist/css/select2.min.css'
import datetimepicker from 'jquery-datetimepicker'
import serializer from 'form-serializer'
import Inputmask from "inputmask";


export default class extends Controller {
    /* счетчики для генерируемых мультиселектов погрузки, выгрузки и инпутов емайл, телефон */
    loadCounter = 0;
    unloadCounter = 0;
    addEmailCounter = 1;
    addTelCounter = 1;

    /* перегрузить страницу чтобы открыть форму еще раз */
    reloadpage(){
        location.reload();
    }

    /* считаем 15 дней от текущей даты */
    adv15days() {
        let days15 =  new Date(new Date().setDate(new Date().getDate() + 15));
        $('#adv-15days').text(days15.toLocaleDateString('ru-Ru'));
    }

    /* метод - массив города + вызов мультиселекта*/
    cityListAutocompete(id, counter){
         $(id + counter).select2({
            language: global.languageRu,
            ajax: {
                processResults: function (data){
                    return {
                        results: data
                    }
                },
                transport: async function(params, success, failure){
                    try {
                       let data = await api.ListCity(params.data.term);
                        success(data.citiesList);
                    } catch (e) {
                        failure();
                    }
                }
            },
            minimumInputLength: 3,
            templateResult: function (state) {
                console.debug(state);
                if (!state.id) {
                    return state.text;
                }

                return `${state.name} ${state.region.name} ${state.country.name}`
            },
            templateSelection: function (state) {
                if (!state.id) {
                    return state.text;
                }
                console.debug(state);
                return `${state.name} ${state.region.name} ${state.country.name}`
            },
            matcher: async function(params, data) {
                // If there are no search terms, return all of the data
                if ($.trim(params.term) === '') {
                    return data;
                }

                // Do not display the item if there is no 'text' property
                if (typeof data.text === 'undefined') {
                    return null;
                }

                if (typeof data.name === 'undefined') {
                    return null;
                }

                if(data.name.toLowerCase().indexOf(params.term.toLowerCase()) > -1) {
                    var modifiedData = $.extend({}, data.citiesList, true);
                    return modifiedData.citiesList;
                }

               /* data = await api.ListCity(params.term);
                console.debug(data.citiesList);*/

            },
            placeholder: "Выберите",
            allowClear: true
        });
    }

    /* генерация мультиселекта для погрузки*/
    addPointLoading() {
        this.loadCounter++;
        $('.addpoint-loadingbox').append($('' +
            '<div class="col-sm-12 col-md-6 mb-4 addpoint-loadingbox__item">\n' +
                '<label class="form-label" for="point-loading-' + this.loadCounter + '"><span class="form-adding__text_red">*</span> Пункт погрузки ' + this.loadCounter + '</label>\n' +
                '<select class="form-control cityLoadAutocompete"  id="point-loading-' + this.loadCounter + '" name="pointLoading[]" required="">\n' +
                    '<option></option>' +
                '</select>' +
                ' <div class="invalid-feedback">\n' +
                '   Пожалуйста, заполните поле\n' +
                ' </div>\n' +
            '<span class="delete-item" title="Удалить точку" aria-label="Удалить точку" data-action="click->addingAvto#deleteItem"></span>' +
            '</div>'));
        this.cityListAutocompete('#point-loading-', this.loadCounter);

        let pointLoading = $('#point-loading-'+ this.loadCounter);
            pointLoading.on('select2:open', (event) => {
            document.querySelector('.select2-search__field').focus();
        })

    }

    /* генерация мультиселекта для выгрузки*/
    addPointUnloading() {
        this.unloadCounter++;
        $('.addpoint-unloadingbox').append($('' +
            '<div class="col-sm-12 col-md-6 mb-4 addpoint-loadingbox__item">\n' +
            '<label class="form-label" for="point-unloading-' + this.unloadCounter + '"><span class="form-adding__text_red">*</span> Пункт выгрузки ' + this.unloadCounter + '</label>\n' +
            '<select class="form-control cityLoadAutocompete"  id="point-unloading-' + this.unloadCounter + '" name="pointUnloading[]" required="">\n' +
            '<option></option>' +
            '</select>' +
            ' <div class="invalid-feedback">\n' +
            '   Пожалуйста, заполните поле\n' +
            ' </div>\n' +
            '<span class="delete-item" title="Удалить точку" aria-label="Удалить точку" data-action="click->addingAvto#deleteItem"></span>' +
            '</div>'));
        this.cityListAutocompete('#point-unloading-', this.unloadCounter);

        let pointUnloading = $('#point-unloading-'+ this.loadCounter + '');
        pointUnloading.on('select2:open', (event) => {
            document.querySelector('.select2-search__field').focus();
        })
    }

    /* проверка типов авто */
    checkType(){
        $('input:radio[name="transport[]"]').change(function(){
             if ($(this).val() !== 'другое') {
                $('#anotherType').remove();
            } else {
                 $('<div class="col-sm-12 col-md-6" id="anotherType">\n' +
                     '              <select name="transportType[]" id="transport" class="form-control" required="required">\n' +
                     '              </select>\n' +
                     '              <div class="invalid-feedback">\n' +
                     '                Пожалуйста, заполните поле\n' +
                     '              </div>\n' +
                     '            </div>').insertAfter('#transportTypeListCheck');
            }

           /* тип транспорта */
            api.FindReference(0).then(res =>{
                res.referenceList.forEach(item =>{
                    $('#transport').append('<option value="' + item.name + '">' + item.name + '</option>')
                })
            })
        });
    }

    /* отменяем показ емайла в объявлении */
    emailClear(){
        if ($('#default-email-clear').is(':checked')){
            $('#default-email').val("").prop("disabled", true).prop("required", false);
            $('#default-email-box').addClass('disabled-control__box');
            $('#labelAddEmail').hide();
            $('#emailClearStar').hide()
            $('.add-checkboxmail-box .addpoint-loadingbox__item').remove();
        } else {
            $('#default-email').val(global.user.email).prop("disabled", false).prop("required", true);
            $('#default-email-box').removeClass('disabled-control__box');
            $('#labelAddEmail').show();
            $('#emailClearStar').show()
        }
    }

    /* генерация полей для доп емайла */
    addEmail() {
        this.addEmailCounter++;
        $('.add-checkboxmail-box').append($('' +
            '<div class="addpoint-loadingbox__item">' +
            '<input type="email" id="contact-email' + this.addEmailCounter + '" class="form-control mb-4" name="contactEmail[]" placeholder="Дополнительный email"  required="">' +
            '<span class="delete-item delete-item--lg" title="Удалить дополнительный email" aria-label="Удалить дополнительный email" data-action="click->addingAvto#deleteItem"></span>' +
            '</div>' +
            ''));
    }

    /* генерация полей для доп телефона */
    addTel() {
        this.addTelCounter++;
        $('.add-tel-box').append($('' +
            '' +
            '<div class="row addpoint-loadingbox__item phone-code-box phone-code-box--addtel mb-4">' +
            '                      <div class="phone-code-state">\n' +
            '                        <select id="info-phone-list-'+ this.addTelCounter + '"></select>\n' +
            '                        <div id="info-phone-box" class="info-phone-box-data"></div>\n' +
            '                      </div>\n' +
            '                      <div class="phone-code-num">\n' +
            '                        <input type="tel" class="form-control phone-num" id="info-phone-'+ this.addTelCounter + '" name="contactTel[]" required="">\n' +
            '                        <div class="invalid-feedback">\n' +
            '                          Пожалуйста, заполните поле\n' +
            '                        </div>\n' +
            '                      </div>\n' +
            '<span class="delete-item delete-item--lg" title="Удалить дополнительный телефон" aria-label="Удалить дополнительный телефон" data-action="click->addingAvto#deleteItem"></span>' +
            '</div>'));

        /* маска и список стран */
        let selectCountry = $('#info-phone-list-'+ this.addTelCounter + '');
        selectCountry.select2({
            ajax: {
                url: 'data/phone-codes.json',
                processResults: (data, params) => {
                    let res = data
                    res = $.map(res, (item) => {
                        item.id = item.mask
                        item.text = item.name_ru || item.name_en
                        return item
                    })
                    if(params.term != undefined && params.term != '') {
                        res = res.filter((item) => {
                            return item.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1
                        })
                    }
                    return {results: res}
                }
            },
            minimumInputLenght: 1,
            templateResult: (state)=>{
                if (!state.id) return state.text; // optgroup
                if (!state.cc) state.cc = 'KZ'; // optgroup

                return $("<span><img class='flag' src='img/flags/" + state.cc.toLowerCase() + ".svg'/>" + state.text + ": "+ state.mask + "</span>");

            },
            templateSelection: (state)=>{
                if (!state.id) return state.text; // optgroup
                if (!state.cc) state.cc = 'KZ'; // optgroup
                return $("<span><img class='flag' src='img/flags/" + state.cc.toLowerCase() + ".svg'/></span>");
            },
            dropdownParent: $('#info-phone-box')
        });
        selectCountry.on('select2:open', (event) => {
            document.querySelector('.select2-search__field').focus();
        })
        selectCountry.on('select2:select', (event) => {
            let selector = $(event.target).parent().next().find('input')[0];
                $(selector).val('');
            let data = event.params.data
            console.debug(data)
            $(selector).attr('placeholder',  data.mask.replace(/#/g, '_'));
            let im = new Inputmask(
                data.mask,
                {
                    placeholder: data.mask.replace(/#/g, '_')
                });
            im.mask($(selector));
        });
        let option = { "mask": "+7(7##)###-##-##", "cc": "KZ", "name_en": "Kazakhstan", "desc_en": "", "name_ru": "Казахстан", "desc_ru": "" };
        let select = new Option(option.name_ru, option.mask,true, true) ;

        selectCountry.append(select).trigger('change');
        selectCountry.trigger({
            type: 'select2:select',
            params: {
                data: option
            }
        });
    }

    /* удаление генерируемых блоков - города, доп емайл, доп телефон */
    deleteItem() {
        $('html').on('click','.delete-item', function () {
            $(this).parent().remove();
        });
    }

    /* валидация, отправка данных из формы, сворачивание формы после успешной отправки данных */
    async  addAdvert() {
        let form = $("#addingAvtoForm")[0];
        if (form.checkValidity()) {
            let json = $(form).serializeObject();
            try {
                $('.adding__dtn').prop("disabled",true).html('<span class="loader">Создаем объявление</span>');
                /* await new Promise(r => setTimeout(r, 20000));*/
                let result = await api.CreateTruck(json);

            } catch (error) {
                console.debug(error)
            }
            $('html, body').animate({
                scrollTop: $(".main__baner-title").offset().top
            }, 500);

            let $itempubl = $('<div class="alert alert-success reqiest-alert" role="alert">\n' +
                '   Ваше объявление опубликовано\n' +
                '</div>'
            );
            $itempubl.appendTo($('#form-request-box')).delay(10000).slideUp(200, function(){
                $itempubl.remove();
            });

            $('#addingAvtoForm, .form-adding__text').slideUp('slow', function(){
                $(this).remove();
            });
            $('.container__adding-avto').prepend(
                '<label class="col-sm-12 col-md-6 mb-4 addpoint-plus">\n' +
                '              <input class="adding-form__btn" id="form-adding__addadvert" type="button" value="+" title="Добавить еще объявление" data-action="click->addingAvto#reloadpage">\n' +
                '              <span class="form-adding__addpointlabel">Добавить еще объявление</span>\n' +
                '            </label>' +
                ''
            );

        } else {
            $('html, body').animate({
                scrollTop: $("#form-request-box").offset().top
            }, 500);
            let $item = $(' <div class="alert alert-danger reqiest-alert" role="alert">\n' +
                '            Пожалуйста, заполните все поля, отмеченные звездочкой (*)\n' +
                '        </div>'
            );
            $item.appendTo($('#form-request-box')).delay(10000).slideUp(200, function(){
                $item.remove();
            });
        }
        form.classList.add('was-validated');
    }

    async connect() {
        $.datetimepicker.setLocale('ru');
        $('.datepicker-box').datetimepicker({
            timepicker:false,
            format:'d.m.Y',
            minDate:0,
        });

       this.addPointLoading();
       this.addPointUnloading();
       this.checkType();
       this.adv15days();

        $('#default-name').text(global.user.name);
        $('#default-email').val(global.user.email);
        $('#default-tel').val(global.user.phone);
        if(global.user.role === 'admin'){
            $('#default-email-box').html('' +
                '<input type="email" id="default-email" class="form-control mb-4" name="contactEmail[]" value="'+ global.user.email + '" required="">');
            $('#default-tel-box').html('' +
                ' <input type="tel" id="default-tel" class="form-control  mb-4" value="'+ global.user.phone + '" name="contactTel[]"  required="">\n');

        } else {
            $('#default-email-box').html('' +
                '<div class="disabled-control__box"><input type="email" id="default-email" class="form-control disabled-control mb-4" name="contactEmail[]" value="'+ global.user.email + '" readonly required=""></div>');

            $('#default-tel-box').html('' +
                '<div class="disabled-control__box">\n' +
                ' <input type="tel" id="default-tel" class="form-control disabled-control mb-4" value="'+ global.user.phone + '" name="contactTel[]" readonly required="">\n' +
                '</div>');
        }



        /* тип загрузки */
        api.FindReference(1).then(res =>{
            res.referenceList.forEach(item =>{
                $('#typeLoad').append('' +
                    '<div class="adding__checkbox">' +
                    ' <input type="checkbox" name="typeLoad[]" value="' + item.name + '" id="typeload-' + item.id + '">' +
                    ' <label class="checkbox__lable" for="typeload-' + item.id + '">' + item.name + '</label>' +
                    '</div>')
            })
           /* $('.adding__checkbox:first input').attr("checked","checked");*/
        })

        /* дополнительно */
        api.FindReference(2).then(res =>{
            res.referenceList.forEach(item =>{
                $('#additionally').append('' +
                    '<div class="additionally__item">' +
                    '<input type="checkbox" name="additionally[]" value="' + item.name + '"  id="add-' + item.id + '">' +
                    '<label class="additionally__card" for="add-' + item.id + '">' + item.name + '</label>' +
                    '</div>')
            })
        })

        /* если есть компания у юзера - выводим ее название и БИН*/
        try {
            if(global.user !== null) {
                let company = await api.GetCompanyByUser(global.user.email);
                $('#company-name').html('' +
                    '<div class="col-sm-12 col-md-4">\n' +
                    '                Компании:\n' +
                    '              </div><div class="col-sm-12 col-md-8">\n' +
                    '                <strong>'
                    + company.name + ' (БИН: ' + company.bin + ')</strong>\n' +
                    '              </div>');
                /*    $('#default-email').val(company.email);
                    $('#default-tel').val(company.phone);
                    $('#default-name').text(global.user.name);*/

            }
        } catch (error) {
            console.debug(error);
        }



    }
}