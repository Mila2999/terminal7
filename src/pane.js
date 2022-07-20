/*! Terminal 7 Pane - a class that colds a pane - a terminal emulation 
 * connected over a data channel to a remote interactive process
 *
 *  Copyright: (c) 2021 Benny A. Daon - benny@tuzig.com
 *  License: GPLv3
 */
import { Cell } from './cell.js'
import { fileRegex, urlRegex } from './utils.js'
import { Terminal } from '@tuzig/xterm'
import { Capacitor } from '@capacitor/core'
import { Clipboard } from '@capacitor/clipboard'
import { Storage } from '@capacitor/storage'
import { Browser } from '@capacitor/browser'
import { FitAddon } from 'xterm-addon-fit'
import { SearchAddon } from 'xterm-addon-search'
import { WebglAddon } from 'xterm-addon-webgl'
import { WebLinksAddon } from 'xterm-addon-web-links'


import XtermWebfont from 'xterm-webfont'

const REGEX_SEARCH = false,
    COPYMODE_BORDER_COLOR = "#F952F9",
    FOCUSED_BORDER_COLOR = "#F4DB53",
    SEARCH_OPTS = {
        regex: REGEX_SEARCH,
        wholeWord: false,
        incremental: false,
        caseSensitive: true
    },
    BELL_SOUND = "data:audio/ogg;base64,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OacUY4wx5pxjjDHGGHPOMcYYY4w55xhjjDHGnHPOMcYYY8455xhjjDHnnHOMMcaYAACgAgcAgAAbRTYnGAkqNGQlABAOAAAYw5RzzkEoJZUKIcYgdFBKSq1VCDEGIYRSUmotas45CCGUklJr0XPOQQihlJRai6qFUEopJaXWWnQtdFJKSam1GKOUIoSQUkqttRidEyGEklJqLcbmnIylpNRajDE252QsJaXWYoyxOeeca621FmOtzTnnXGspthhrbc45p3tsMdZYa3POOZ9bi63GWgsAMHlwAIBKsHGGlaSzwtHgQkNWAgC5AQCMUowx5pxzzjnnnHPOSaUYc845CCGEEEIIIZRKMeaccxBCCCGEEEIoGXPOOQchhBBCCCGEUErpnHMQQgghhBBCCKGU0jnnIIQQQgghhBBCKaVzzkEIIYQQQgghhFJKCCGEEEIIIYQQQgillFJCCCGEEEIIIYQQSimlhBBCCCGEEEIIIZRSSgkhhBBCCCGEEEIopZQSQgghhBBCCCWEUEoppZQQQgihhBBCCKGUUkopIYRSSikhhBBCKaWUUkIooYQQQgghlFJKKaWUEkIpIYQQQgillFJKKaWUUkIIIYQQSimllFJKKaWEUEIIIZRSSimllFJCKCWEEkIopZRSSimlhFBCCCGEUEoppZRSSgkhhBJCCKEAAKADBwCAACMqLcROM648AkcUMkxAhYasBADSAgAAQ6y11lprrbXWWmsNUtZaa6211lprrbVGKWuttdZaa6211lprqbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaSymllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSAdgFGw6A0RNGElJnGVYaceMJGCKQQkNWAgBpAQCAMYwx5hh0EEpJKaUKIecghE5CKq3FFmOEkHMQQiglpdZiizF4DkIIIZTSUmwxxlg8ByGEEFJqLcYYYwyyhVBKKSm11mKMtRbZQiillJRaizHWWoMxppSSUmqt1VhjrMUYE0pIqbXWYsy11mJ8rCWl1GKMscZYazHGthRSiS3GWGuNtRhhjGqtxVhjrbHWWowxwpUWYoq11lpzLUYIY3OLMdZYa665FmGM0bmVWmqNsdZaiy/GGGFrrDXGWmvOxRgjhLC1thprzTXXYowxxggfY6y11txzMcYYY4SQMcYaa865AIDcCAcAxAUjCamzDCuNuPEEDBFIoSGrAIAYAIAhAIRisgEAgAkOAAABVrArs7Rqo7ipk7zog8AndMRmZMilVMzkRNAjNdRiJdihFdzgBWChISsBADIAAMRZzTnHnCvkpLXYaiwVUg5SijF2yCDlJMVaMmQQg9Ri6hQyiEFqqXQMGQQlxlQ6hQyDXGMroWMOWquxpRI6CAAAgCAAwECEzAQCBVBgIAMADhASpACAwgJDx3AREJBLyCgwKBwTzkmnDQBAECIzRCJiMUhMqAaKiukAYHGBIR8AMjQ20i4uoMsAF3Rx14EQghCEIBYHUEACDk644Yk3POEGJ+gUlToQAAAAAAAIAHgAAEg2gIhoZuY4Ojw+QEJERkhKTE5QUlQEAAAAAAAQAD4AAJIVICKamTmODo8PkBCREZISkxOUFJUAAEAAAQAAAAAQQAACAgIAAAAAAAEAAAACAk9nZ1MAAEAXAAAAAAAAwksAAAIAAAAIqiHRF9Czhv//Ov//M///jf//1////xr///97bMnsTKbrO1nOErJXMr4y6XxJEUL+zfnY6duXHWK1iqX0rMPVWEf0MZV3jWh1oaIoHfR5KFX+JbH3ZSlLi/0xYvVOf0N6Xr3M7iWk3Df8GPV8CpwQKWpRa7iW9dzFWqgYnmGxGKjKmcC0XWE3pyRIttOq2WOOh6u50JTfVgjiDHuqod3tO001rHVz4cXlC8qz2kVq1fYfgjGDjqfFFjLldFe7i1+SKzXfx2dPTOGDXNTK2OeF2Kflwn1+41GrxLj5BkP9Oav8drabRmzu4p5vAIwavzYb8m4Hjiw9fs12mLsuTF1GlQpZqFYRY8Tzex1KpA5bMqi0jJL9+lS1zNbxch4xDNNzF880wpzD9Tlj6HQ/NjYdrp7r1V2jZ+KjPisnnFLK2hx8YXABjl/27yEpfcUq8T/1iX+1Bo586yTbRQj/7d2wFrEaVe6C1JknIi2pqIx/HkLkIfY1Pqken/fawlnZdlWf5/tcNJZoPJYrge8tP9+G+inQ4B947lg2d/Zhi5GSjCo/ftmOPaSTHTUqXb7/Nq50GCc7aiizKR5HUXGABtD+QbT72lI9n/XoyCkT/ykzuHGIZNSdJVK0AMfjoXdk+IABVggdIdSVNCAQtJ4rrawfbYrgFwcPD4Av1/pyfu64k+J8K1Yo68/u3vRSdNf/imoKWX7dHkGQNEpllrJ3DW3Pd8H2GAAalqQb/nuVFDJsYWFMSTey+VWGibCFChdQMS22dthph5122NrY2tgCAKRYtpS9VGnn0qVKXBUFSAAgIDId8FSMb4ALcPLWM42goJf2FrcIv0rmeE0Rmr552qdMQ6oe++Xq5fseE6k60n6CziofKIxU2wQPzaEBSUBoApmHBMUgOzHRE36khYfkpkiAVjetPXsEmgCfnkcD64hOJ6ldJdfMrbH3FP4yGj5EgAIAkJIlAQAAF0MGWIyhYUVdnxQN1YTIyMjIUNuMamQUP69/UTGGTQCq8D4umDUZuZTVt0qbHBTeuflNi+Odx5LjzR/YJ23KmlILQRdVMPoDSFbXHq5Yhmc3hju4z2zdz+p6DcNzeKT+nxVmYz1RcbxJws2/pFsnfhX5crF/DO/yOc11OLJnstNdjz/lYKZLWuPy1Oqpscpc1taGzla9x/xC2pxDhywq/bC1hkU5NXk3F6/FwrLkGzQv9fEv7YVkcx6TR2SMtIrD9PVyFKUh5UxajolJxWJsrnOrU9xSYAAKrYFflgGHQct8kQeu8SHG7+glvgYJPpgrwhHv81DY9sIMutE9B8564qoX4Cv+NL7O7T1N3Tl2hRdRP/YrGre33taI4lVx7Wfm4tzVhHydyQzm33nzNZsutt92P9v2UdgPwcsdG/7N7/Z964fbzPbP7Pk2NaziBTUnv/FxM63rL6zf/MEc9u16mcmz/1K8Xm/trwAvZwPgzMDz7bfBFudMZ2GmXPbYVf01AKALAPABvnXEwzaXGlaCPcpOMdOVhMP/la5Ggh3sorCwARBoMz2W09cVAUAA4QAAAuMBChXQAEZDIfFXqtlUzzGWO9kOBDlPpr0DbP2biOlPdiB30WIkPybQ2fwvT5l779YnqiobxMjcLdrCM6bqB1scAiZufe5zB56RS2KYDCXpTqUzZqerVFTmHAdAUwGKAm6dVuQalSt7pjeQbqppcnf/0v/2MMvk7NL0PETSdx/dbiAJwtM6TU73PAs0vgV86iycBAAAAPTXE3KB1gcgAETNNAEPxRX3eB//iYZekek1jX2wzoRokXr5to0fn9Emq4ujdpVTFFzL/bRg/B7sUK7SF1rYPfIwhkhuWb3HNOJYH/ZK1ntU6153zjwvJz1+/yucIXOO3fdHNiGzOqtrqhy7PLuQbd3KnUQh5x3vOu7rD7CjDpqP4g7e7X+we2XR9bynpzdGgWld32ep+2pxCfm8pZc8zJaveFyTQQET8gtmljwevYiypPhvrwnF2cjPViHiawX8j2/T/OMSfNb3yBp2TozHm/MvRcyFSEGPx5sNuuvdisMhxduJOuRz9yKGeyFejC3TJCQ+tkG+InwvLuyXT1SIVYtOXAcQqGXh7NcCAPMHlPW10w3TYkHOt1Iq8PIDzyUX9/avL+22wk/aJ93H5yv2zSbH6wvaf493m5yf5UD9rPfffmt3TcGP/WlNfxcAbsb4vFnQjxui+zgOnp24lKYKeMZ3byf7Apqk5DOXBf8AwAUXXkWkG/yV4VYjoR0+rop46I80tRJa0Q4fNobZWQAUSAAgILTBBVB5Gjwi1ZaN74GPS5b43bZxj71JP49AE6I7R6Otxv6Zi/S/8XBQzXnG1ZfSeY3k1YL4LUKYJcn6wUBHFdJsEzl6L63z3EVjHhqXMhLauURvdb1MB786kMO1JUfiXtoSdH4k+rk1rUrHpTg4R3U6hwjv4/lwD+MfMsk99x4ux2M8er+P81zT/RyR2CP1V+WZ04d4Qh/iJSJmUjsmlbz+Lqg05tULzBX/+qFzKuA0xeEkDYhEZ/fG+5uO5u/M/kweKjMwCvtU4VWf5KiPyPQdO9P4QEmFAi4AEcAQDgAAAADAqzOwuyZsh0UFkOWrSokBgKwe6/i6ROBnI3N9FeM5f293ocT5Mfhb4l+LVhECdRvYftbi7NHc/pz7Nte8JFhcp44O1bdf0fgBvg0q4qHm9uBNLMmU79k+dCfq/3CBnvdtAs9Se+GTQ5s7rpzIRSpj3verIFW99eTzTbvF9uE0upFGtDnKRHo6mo3fHLEf4wnWqL+4uafv9Bf9Cv5SamLU/ZO/LxrVbCXEAhC0rP0v9ftyXLiyN8PF6ecAfbSrOJVvKM1BnoO40Il+1P3G25uzs/P+nmy+7F7fKqj0l18P6+t+LzP5jF0XiR0W6P97woRc/Mqy4rbkCx7ZYev+J0phrNQjGL8ng6wmHXbKywFJvHsqnF58WpIf0NREKkAP0zdV2zcQvI/w4XXCcY64CaYwphSRTCA2qoWz+mmPsV0/lnNi1OluXgAp8wv6+8qLp72w3Gat7gH0p/yVToZIN4/79XWEbt6Hb/ZzEhtP2pZf08i/d2Pv9b3nbZqzIS4/WFdgx7XXYr6T3hTEG/yV7lZD0A4fUUK6wV/pbjUE7fCwMci+AwAgHACILAUo12CfRwuHgHZAouV6HA3mvTA/Vg9MFNc72pHMggo9O4GCKBMJldRxj62zd2wnW//ecXRlz0LHQ5+6cdUzM3Ruj/sw2/yOV+bW63DJlcrcjGropqIP6Lh0WgnRiaz1UyvNEfYr/tiZIfsojKDcS0/49yOZx17/zifLY/PP4jWf2wN9/uUTrZ891I9SK3MliWxIhSxobWiK6c+sFGgH7VRqddCoKbHQRdaY5lgUmO5x6cx2fRaS2fz+YD8g2sLJzBxb3UGy/vt9bBPdPtBAFC6t5rM3ILkEL53oXkGO3MG8L/Ls3dI0Qe/tGU6vgYrvZdRqQAaQJAAAIHAukW6XS6HOYKnljADMmrpVQB5zPm7xJYlKOZyK4kTys7ODXvWferTsnuH7mpcoAuiXstZmwg3Xh8p4EdVPmtTjs5UgzervybnfzrX2Pfr/0OrkacVFC07WSyAnKk2/aZdY2rmgr45GcbKSvWf8tVBeFgf43pj3VL27RD3lfsR+t998tql+LiyLC4/po649UpZ+3JSS/9Np5pcpbPF6Yzpo/Cvrrf4ay+1v88lT8KPO92S6NnvpLOtYNApqj3N810KqnDifCezlSz5Zxdd4pU2U69Wj9X3uTK4jvvd0huavzVi+0GhzcFG3pidmAqckGdVz7+wy3TiQjLdPB+Ra5JdPwIUDOKt7eHWxHjfv9uRrf2fTQplyuecBxqNHiZRlrTrumZ1ad+MDVD0KvnK7pcLy7pWe269npIyrAyG+WOeH+v+K98qte7BcM9vP8SF/WPs2XqIh5kQ92o/0OLkKG6G1bNXJR+HbuSaaqBOnFitOHvqM5sc3OZarPFaLDT+UAMCtpI+TXSx6SXAv3LNndHj5tAz2/2fNGsBFNVVqJZb+NR643JAxsJs3ajxR3+q5qPj/Hm/Y4t+zCQBe5IMb3VxaGQnBmClWkoBww82ll9HIDu3wsQEACENdWdUZAADCAZKyHmq0dr5TdvJrlT6oJsHuNtv6GHT7ScZBn/8OlRkanctjfitNhi4h9PVvjp+fj8KQDooEdUKptOR1imgQABVCp+vfsW5yjF34Ob8/jzo1oCgcdFcnJAUt/tjlehof+nM7jVaRQ7pFmoM9eKgc5jrk3+uxkOVK7yv13xz7415u/UJFJRBQdfTI9XGIqA8HeTyLmYhnZFck8jiEVGXmdD5/iqbPh/urB9Wne+fqa3Gs3Yfe2UdXt8kSFkKy1V35k9/cQurnV9R8DDB55e/j+HuQo0oK8jkwzz1h6vHja58zx2Efeg6J3luSSbe2n9ho5BqUeGbEQw0UP3+G7HRHn6dwePSuGzxEhQY+VRS8ARdkVwPXMQAAAIAR8LfGnL5LBiBqnzWFIPHue/QB/4ZSIETzuXVvHp93mNn/LtUPR/V6FHL23pov/5qTWYd+tf+897E/Vy2gVgPs3vOzDhmFttardHdjkpdvPdvirbIMeM03L8geAuEMud1293zDZVVrrxJPK1g/ImIfapRujQ69ZxLa/AuZXTpG3YFu0+IxJ7t1Xnfzj3UhK1tDzFPPfjSa/t7gX92+3aU8BsEoec7A8Z7fV37vDuXvldmn/TL7t72Ockt8mpNYzbQYvtTyqH+dUnR2mNx0HnrSeHl+E/fTN44Y679o0DfUDcv12d5ergoS9OCdNa2qIFvGxx7+B57jsdTm7v+Vxv/cdUVMKm49bb7Lh/ge1yrJ5x/mbHz7t8SNUs1Vsl2xdrHHYwgun/hbc70ZkjZQ9yf5bFPy0ue/K4XxbE2vEz8Y/6ICPclT0n3iKc//7nrdNbOeySmX03FUPg6Xpuu57gjCu3q/R4wZoOZcIlutPH6ivC1dRtfDSYdTF5TUiHjAifANg+NWxHe0K7wqCzoAAPhcADxf5maIby5KFZn9Zn1fvwvYuhaQ8fT2aitz838/n91r+x7t+23Y/KxX88HzHT9r5nZbLegmRf3QeUZMv9gwjwI1zJEcW+QWBf7Dgxv5JSPcw+GMEhjq4Y38kVHCIuGMIrABADQie1FbTBMABcJBGTYamkBfW/I74eq/qX+QI/XPfUyNly0/Yx//MSH+KRcluC9fPr++U4NJVB3YQwVS46lzBwpyn/p7qkXI4mVrTfUkoKI11jpdTDW/5f2WvrG+nLmqVEfWboiuLZpBzOFfRk1W7/HnxhdTXX3GwxTy6+OTozPrtzANkf0bMX7mFU9SI5gCKtlR+0EICS5XiZxDkHSoR0Fr0cLPZLQga0d3bUlVLZynLhndAnmkZtTeOwLJznl0338zjTrkGsMv80fu99T65/Kn22dSf/Jx+nHw99Yd0mv6mH+F+Hv2akZ/JoGD40RXh705UuwBFYcMQZHpIwoqmxHV816/ATGasM1xD2qlHl2hO6vCkHAtkj39zOPc0fIl3In509RPZcRvgf5NCkD2sbPvggA5NHmXCl/j+i5QNAB8IKIAAAAYr/DcWJVf4ACyvnIh+Z+Nk+1lZ18qLLaDLwuXnSU2bG9I3latiWAvTXqw/n2pif+NFnz2dSNOexGvFnaquu9ueoBflRLQOxG7C2erwSvn2y3m2MfteXz2tZa8PeCw/gbJjq58OMtRnO705wpMX/UgGfuzcvhDet5+BfeS+0v3jXx4yhUaJ8rTzMWKUzIb7643vTiuBEETjfZb7JYiJ89SImP/K/id7v8D1cOcvfwWcV2fpirbPXMV3/TG0iPLjvuz6unl/fv/g3eV7xrHHoy+FQ/sCj0b+7g+m+N8H3vI7OPp9VCYbMueJZ3y/DBrfoJ3eS5HUdjN4JeME+GGl2ZsNOXA1bfHKvThupAQU/ztKnJ9ZYX7blIvFcFhn+fXIesaEpzupm/oPr9/Y7TUJw4XBatp30VeT6u65Xp0rV3eSMYqozr3W26h4HV+F8OHRp+XkNtdvBjgK5QddEf2S3mxNMcmOdirzFGPO5Y3xefccbbPc/nu4I2EX2vIKDJCGGcf5qsc+mvU7f/Q3e3cl57dpv+a1NCVTFuKJCz20arzxavFZan7GmyosTahSBksAHoRzSPwmmMTU5KFSJ0Naom05mSm9/nwb/4uNkHC6Y4OAIBPwbRAyUn/ebnl6f3lKntlIKntx6hAFmxOZ/8yUDn9Pf6OpeSc6d3K3ZPPPHm8mvb+hfJrhrb1v1rPe/xVaVmg0IBbFbcCAE9nZ1MAAEArAAAAAAAAwksAAAMAAAD8ZSnOF////6T////U/////yn/////NP////8nvpOjG37JKI9wOAXo0eGNfMusiCg4DbAxfjv9AACQIDLGGs3Mor6ZSuLA7LFlJp9PMVNCCxUu5np+tjyefL5Z/7Zlj+Pj3iMvxn2QR3XaUTpSNJlQ91BIXndxyJ8PmfviNYpjD+zh/Zf1Xvi/w+p2KIw6Rty9CFQDtMjKRLwKTnbMpOyNQ1BDq6Kdx9upzrcEctBEVJ0cKNxOaVqPq4b2I0ke4nTRvb+yapXMigrO4RD9RQjpTooD4EDSwDFzdqXyfWR2ZmqIRNd5lyosCE1mpZ/QYNo790zN1po1O1BADiZORbRQ0XnvCJS/fDlzaR+Pf7/8PT/iOciikITIhmY/WopCyZmQWSf4d+CV0KMZnU9ZWovty4iKPieevZjH0Xy2tI7EcKMgcMU0kUF/hJNzkUlGHErSdHUq9agQcCpEF1IER1HDAY2tekhk3QD0nc7hQSXNIfqwUdF08uWwBaAAAAAgmkJ137MzMlmUOWYBADPVoRpkqAR2qi9ycleZ/Vn8YdLRdOmPFcJANwU+ul/i7SEvR8rlXn8Nl+c3qv/K76UuuohsbgQQ6MS/0Ghucm/FZy7EKIoIUEuBYp92Q7mf/Rr/3BprjHx2PsvppCd6XKQivuhPtUhXTsU/tfz8nNRlejwNp8KWss0e95bbmWGxm6NkJ6vzVIAusMm2bkK6XuYFWnuf2y0R/KIbvvWLXzuc6aLS3S3sTgz1OR9IfvSfT/F93YfGG5dP9j24yfrt1Dm/aEL/NPt9rEHvsKzcamkY9wZau9YGwkj+lifR7jMm772+ggK7UzOJ+YpzLe5OYCOqWNRO8c9wNfbzpY9RUcIOrII18wZvWZffOMw17X/pTWORIe39ucazxZRFTOtGXszONNfbojtyZWMHDuWSXo5z916Wq/XjeX9SWWqz8K5rG54xvOddHu+d+nC91a/2zmCv5GXPf/TSrX7hfRVsExm/p04i/eYh9axxz1N4rZ04g/2UTGLltNjYzuzsOZvIjU7oSRlBMSi1rrvIvo9EbBrBTbnKtMLxyf/QynuBg+ZyjlVRs8dvcuhd83PKweua/LdGiG20dWtFQgjAUuKkMFZjFbUojpJg2ku+u3RJAE/7egS/lq9+AgrVZP+NulfDf7NWV6ENmfutd+Pv4sVDMPEz2Frgffj1Yi7W3KpQ1pcpBe/puNJ7qhjLvS/pZ9jNZ05v1aEgehN9+mha2QtVS1jFxSoLQvvOQIqtZYPLIjdWoADeg9NDHzKj3H/YBcjB0eGfMiI8CKcAGwBBBEWKmP7HBAAgnEAaK5NE0O0r/A6ju6oQ2oLP+1G0qDLyEPKiY9bmZbrzY3sfPfalVUh1gooQEfM5mhRVDYkaaBDxbLPn8RcdT+IdgVpJJw7pmDOcGgGp1JgO6adqdXSie0eCrItK1TiU6MjgBGRP2ahWIvv498y/zt+Re3noYT9zbdWgot2qUDyL2n157es6mbw+3SdUqhMdIDHvZUark9MRKrkjzmt5OJJa4RInVaDWVbOpOetB/ZYpvNodSKVz7x0NIVDm2sKRgiQjI5PeoaQjfvsQvbVZty5nbrJCOIHuKcd98eyVl+PX+bmw6ctRAk12hW4mPr6m5Iz7nhr14ek+5s6Ah34/q8f+sXe2gn9SbMK1yPaxRP+2nK/pXkwUxd6cOEXUSlOLOn86AuUBhUyJcNRJXEQRkMPJg0oImQEpMkd2c5R/sckVcey9Z8gdPp+HQoeQ/B07r+nt9OxM1YaHbt4DeAMWQQAAQDhQrK3gdyUugJgwEyvA2MHkxttf/fkqpWdsGz3uWJViabiY0gP/0QpksvvcXuLk/pKNDOklXru4X53ND4pFHufgQWn03f+MxvjFeXHaV6QD/E4vpUjG905wyR7nP00PwiRpDy1+H2Vq2/8WbbW7ZHbhp+c93Lfe5iZPkTyI9qwbtlkYphhOognX4fHKvytKC0a1Kcqf1R961tBW0kfTPKXzMcVRdDy8S6gRBPOERj9ld/X4J7bLv2noJ3nbPFc7ucLjT+23c+E/oQfGr/YXn1rV029Ok0rUPOT6Xr/Wb3X4LxL3HxBuobHDxoibMTbDftiJYhiEfgdtFXgUtbKKvODePBfc4Kk9k5sH8c5bn1Cx6EK+8Y7e6Xl+s7UZfeQfMZW/ZX14FEliXpFLzF5SibSIA61WrvUcUETU3uSXu0LaRPVNY0xOiS3HKYel4uLIOm7cIiWKNopdrTLrOIKkmzMmncP9Hx30t8RTixAexErauB8uRckPmjaCgvdYrnfvBnGrVGHYm8QXIv/Rz3f5P9L/P4pVPyWvga8X/f4m+7zWQ7T5/5fX2yJd1evu3/y+b4tWb/X8wvFBiun/rbnB55W2il99+QzPKnbXj/vCNacxIfqLQp3o7P9nYR/aFgF7sneuNwLJ5QSDQ8UiOFWePKn36eH6OPgIEXsKCgBwy75oOIAnzS5Go/Luf6661buVf7e7TXybcX29m9ru5TcvY5Vl62NJmSNP2pynL39q42pvd35723bTouRrsvZY9IGBci7qzy74bhsKAMATAH6DaxtcpOqJcByAHlwffpXpJ6LwVoANABA0Lt2f7uEVAAUqAqwKuuuuq+i7KwYJqQ5QnUuSfNGdmlQ9Kk6GEPkI1XRmTomlvtTaTz0ZDp0q2ZUURGuteqCR+kWoVNapVtFCkTgqEq+Oqo3SJ6tqT3qp7oE8VeVj/uo6NW43w43qdJF1T1q70chrdckPtmPtLk+dt8oTRyS9aMShhRzFCeREWe6da80/siECHAKgiFYpQSepSb3+UMeRgBBB9lA6sxB1Mqa9yVizreHrFBx/n7K92S5gUu3D2SnCUR5qUMxkyKQN5OxQVlBaK87ThzrUprU6zBk7oTUdtE6E9gc46UFKx4yAA51Cc5GpMaMT2/tfl9hdDjunH+0c3cZ8uidX7xJH0SpVA6RmLFx6yP3RS5xmuJFfH0F6RgMliQycXiRhl5Do2rQLSeeDIHoyro/OYj30I7ejvyRkhj4AnU3PwpxTZf0+MoPDxVAfONY1U8m8oiuZkSdqDWrNAp2FkmI+PuJQZeZTJWKGjaO5o9u8X6i+EnSAcnslN6Kd+nMFjpJRQYVnYIIIAABgaW7AYP12YwQgK01YSc6NAFTv5T4pXjGSq4ZYddxpwXPmNs7IHO87Fm3YnaNv5VRpPPa/OYReHfY4DR15oy94QITaXkivx0ISVMzqkLb36svnyWGkekm+mIOz86j8x6VugdvZeV3LBW/EG5qcXLq9wKaO163dYGb1Z11dhtLws0RPUc86IuOmn2p36uOJH/yv3r9/wFuQazEiPivumDEuapxNF/ErzLepW605fFYTmt/NL1TpUdc9B+/Lt3peKI20JQ+oQeTntladmclNwPSEta/op1jnnySc1VrsRKrxOw1ubcGvq6J55t8OFv6Joxan9q7MJd43lQmKb6bESySXvMrDlYkh5GRLplfZteKdTWx0mKcLZrL5ncqPv+PpRKE7SCk9KO/CSl2XEyGoHt/f59jsv0HxfY5OJ0Kz0ofNubSGw7H+pRf+UzpdzeC31asIvUNiBsWW281tITrhLx6qBLqVNFmDtrrJkXrg0y1aLyVp5NePjF8+BxSZZYDgbbnKVdy4vet1dSV5d9X1/bENdu75poThiut7UrUHKc578AAFFVhD1yfsDHe/Nj450ahHBuXv3h6pcJHP1XYWilQ1/3ZXdAba9VXzX003is/Sr5le9sui28KdO6wSsDGaPzDk8P/XSu93jeKPGzPuHw5OnXLdIcEOZOKAxhifngL/iEnX4G7jpNl+mNV9Roaphc/48rcmJnPzUSfbfVV+spTnDl9jTvsKfmM9vv9bpOIjpkdBVYN7CMaVr54THjAYPU5jLBaDwVurO72ojT/lfrRRKhBPATDBBGCvsrkZLDp3Xn9GG5HD8V4or+OIgl4sCjI+WAasgkfar1x5BQAA3oM784t0bRlEUooWyMGtuUMqLYKVyQ5sAMB1y+8xVEYMAATQBhfdQND4JI6wor4i+Hj81tLz559doyHQlJmm+Pda656OShK1yyM6MzNzTaKn9t6pQ1ZJCYhjFZ1kj9D1qHAX6H8ectSUrrN0a0uLU2PdpdhbZj3joan0dVDhutRbJoqeGPZikirxVzY3Zjh9TYtMWWutB0VlrzLRyedeMx/dEXtoDjW75bxqwezUUIenu+oRDR2KHM9FahI/patTFk49cly9Z0K7WWufRX47J+5s9e/XGDJXHDR6E/fL194OGVFUZjJCNNc9O1ceUqLY7xRnyY8cUSkSpWdHcol57V416aNb6G7w9xcgNO05Asw5m0TBfvw5V/cm/RvHx9Z10fc97yepC1GWq35ECvLMG1SY0ESo1xXrkCsrGWa4SihbvStBkVIbQJl8PJRctE6exN3N15gifz+QlP0ps9UfhbbuwcyxDrly85/1gDaTyXKB2Qhyc+trIujIkC72qFTOdavfH20iWkf9ReksiAqH0NqVA02FWWmE4GuEgnb86+4W7Tp33+4hpK9jPK9Mvkf+dbachkYHCEAhARciAAAYZBfEXaNHFgaAL+DeppBE0icwMl8RrJTUw+ojv+SjYv8l1//9Y9lVK2pdr+dTLDqRG436apbui7rLcdYoppDaEtBkOqndLEldBfbkpz4Wf0bD+WYt9mMyTRMPBhWvLanncEL/OqXnzlKHPxw1tTqzeTc4UOELtNSj9+OpR/RiWXnpNuynypkWCsyTfweWXOV4w208pU0CzS/oFk7/lZlSo5dJIOVPK7v8c+dWcjMabIiHlTv4NX8RKzCzyxhZd/P/0LIbjAQGPR01IV+RJZUc72Q8H+vm+zgf/HgDt06C+a2cn/MLEnC+TrbPLxW62182WgxqNU7F2fvfuOl2Bwr6aDdhm53dCaUbkpVCJefbf/+jyxfQJ3cgXGV7C6F9muY75hisyM8/020259yXPaufyNaS4wiRbarH1vrSKB7vtM5f+o4qFTrxMde5xOsKt8kXel+86Y9onTwLTSmoGJCuru+epnV/dn5so6iYIFXHkPhDyjP4/4tekgfh86Qa65f/JS9mcM5ce0Y1BWR9W/cHCSdeTLlXGxk4TgrzPswHr+/78e/mVy0j3uV+tHFs/l3jhj26BKfcL4q7JSry1R8JKDHoOS9xFy3023zf0pNfc5Mq3Q4/N7T6Ki5Z7grpTl2S87qyulu2uPnl8Z1bNja4AEzHMOM9fwxxwfVrWDdo6GHfQYEs44Ybp0/BFpG/bY4rG6gzRyv8fz1S/67jeD2zf8VX/gD6wWn5aaNIbZRLM46tN3Y1XFs8tJI5NGKs3xyE8CYxYoJa9TiJzRQeYbjJ7Hf1w5PYtgMen3OP+tQfDygYsOHFBPhmCDnPxPrNNJYCAH6Du2VHSUqGA8AO7pEdpSoRDgAbACioeortrzYBAFg7fBY01BTYyRD5RM8OgEp37SyydngxgyQTrztTqwDEjkOi7KqNRO1C+gEFnG4pak5XddKJAnKuEMF3rTj7XNmpg7hldGf2u6/gQGp9ulJcrVBQBXmfVM5ASVqSJe/X/vjf6/IQy/XaGhFnVhWnm5r1PL7rVSuvrtARFQTQnUZmAU7PRdY4HJmbXXS2zPP79TGJ+ufvTMnziZNjrxWIcqIQ3lpkVLpWdq3fRZVDyCIGlRaBnIiutaJIwTsSQHXAiwPBqU3iHkoG7BzNqFKJbDlQhJzflelg+dp1PSz3vWkN3fUYHSGEAtE5SQeBHtiFGiTgQB1RN33/i2tFNv11z6QB1BRwnOzi6unrkUJEEMy65xGRHURs9xa+ADgoCNUQYfKJcg+qkh0jyNZEBKKtkLMfVLo9k0wfGVO5hCLzcEWbuc2WrcrfJp9N0oUOUdzzce8RciGni6CZOqlSZPCc/cmth/YskdxzjxQzlfZB3OPxOYybddV5d6imZt+aLULwQgV3FijYAlAAAECCnL/PYqeMugGotioheXM2L8Qm3rlKPN7BE+Iv6jqVzPCOVLLng8VxK6PWUocpn8lSfuEBazDuCthaOj9P3YhuX6afGLuXqY8tj1rMJC+FdvGxTbUxOreTOchTq8m7F5Ffh3ICtFNYtY9bfazP6Yz6Lu+pnsumK2uMPlxkbNV3vAjX9sXeLb441zGc+JGvueIhK8Lgr/Erx7uylzo45cTptWKGeRT2Mo3qKoVec1ZBZIUWWhUVJfjPa+ORnsIjzcgy/oPUuO86gt3Ic71afMscKd5ksK+XyqMD3S4x3PvkkOjgcU1TXeH4leOlbr4PrLF7dJ4AsymDyV1bUrBdiPvwDZ03WxzitP9XdVycUJUXg9H+7Vpa0LmXDc6UT+yZ3bYzY29pPh4SsxtWMyt2jUXYd9nMfLuOIK09WubeIra0mDST9Rdd5fhry5PpNrI7eQ+rGXPxmcj7Vkx6812Sl/wPqNJUO2Myf57Ky14Iet/2I85HZ2vnpcXFRXEyOea37DY/KfsrBSXovzh9PYMdb/rJHpeu4PSo9fkXtjYvw+0E/SRebfL10eFsecH/+JznbufzL63J9o8D/OMxijunjsb5xuWTxz+7Xs6YLUE8OgBAYxdh/Mp6nhOlk1/lr/WntJQWJi9PtbVdeNZ21wvrbUgPXwisuPfZXduS34Zv0N1VTYt3X2Hd9UtkkrcoVpFhc5mfVIpsJflaFI0vLpxjwc6Zbb269sqb/tA9OGpgtyjrzYIOj7WzQj5JPHt4Q7BtEFJW2BrwdVHwGDREzojgRY0RYyNN+Pn3f/5KsnYWR/MMUegzF+e+Vq2j+6/Rv28iY/MN60y8XyuMZRTVB09nZ1MABNoxAAAAAAAAwksAAAQAAAAqRYkGCP////8f///13oN7WV3KIkMOADm4R9glL8J/N0iCLQAk2QUOdQJQVucIIxHSW0ijI4hx3e2a99r9ely27uGeulbjet/Q3PTxLEbi6c7+9/URv/X1Xixv+e+WumSsi/kw9d83f1856LzgH3+bmxuyHe7PsPZR8j39+FPmc+nfl9zRkEp2VLo4cq6SVRQBKq+9IlQ6yZpFR51SJ01AVZpXZrpDuiaBZiI0AdFCx7rmM6Wv/dHH5ffnXcRZmxqx0gJ0H4gozipZSaeDL3vMR6tFyMPs/J7m6FrlcqaICghLHXKFYXQYhuy/h7QGCDClVIiIqJOkdmfZr1lJmQRw6NoSSSAtzcFezw+tBEBN5ZBGZZbUbqGKA/P8c41W4tfoCL0ifp/KFNc9701+Zk9eyy6z5H34QUqvbEcpVLfDaw8xdc88rs0TE6GEv0M/B4bfnAM9XoyF3E+R+O2sDteoFLuDOEBHFBROy59tfDIQaYlP7eTghUH3vm+tohH5qwKUhG2XjmxkbnJTMgFiI0UP2trfN5b9a94uo1whaMyzFcwrct8jpyPzEd/nODkvh3gCD108z73mL/0P9kM8jHRrM2Z+6m+7RSLzISppaDLS6f1TslLqx9sLACwMAADQgFkq9Xdd4F39LLN3j/ooAhKKaFZ/g+feVgmWY7gnKt5fpkyasuj3slxvBlz5FbvUf1OS+1Kd94u0eFy7PDsz/d+OXfGsSsiU9P6u8FoLwft/h1txh6D+cso4OUUAVq57vMy3g26O74YPnMXZUWoFDtLt10pFYSxBaxxCZB/nGaRvUu9TAzucpjeODbfiMZIQQJHSTeDCEKAFWXBf8Tgk3WbTwukKmz9CEb64M55nMDnSltjPLM2Qdslie+Zrs5DUASfGdY5wLy6P5MZtLmgqSKjG7MvKivWIW56toWzLgwzPdDjk8M5d9/6RZTTXdt2V/2MAcKIl9v6q+LCfDM8gh//EMmE1+Jyx5w1Uyc5ZsKoQlmPCpJNYBJzIJPaJ1ceXBp0S6dZ2p1x7ajSTwkUHwP6cMSt6/LBf4LhmtsxfPcwUqiEWXSdBazaURm4XuMNsF5WzYfcJj6V42WMdocz7AfZhcWv38pj7bcQ9/6UPlet5X8z41vX9i9IDbhu1uljwuK5fn35nIhZJOumDPr93M+HgPLux175uzveldmdysd6emd/bI1bH73c7Xj84hvwLCXGcW24GLaE6TaWsoQH0F1cP1lyZr0rZZ2rDx8DYOMymV15yfDtlCr4Yl9VJWLPNM0a/3c4yMWdsoObtJfAK5yvtTWzXtS4nX/S+tl2aZ9DGAm4bGJft41qtPklvHr11k0Ay7uf6+opJe84hyTOTVgEJCIgYJW91EWrq2A1b/H3S4OZn6DAItpgTyoy75ytU7yCtbkMCAl+amH6Du8Mu4Yv7yVCqhopzju0Bu8QP95OhCBVnO3A+AFFADauNVcB3Z7su9X29H7qE/2vV6IrPyEjRXh7Px7OBApFX6bLrc93Xtm8ZGRk93XVdgrWKfTsejtu+ZaSohAfwAPnUqVMFSl3grXd4B069jqkagHvqFA0gI0MBfG77luGdXtiQAGROAafWnr6ve4+MhBTNAMktgCRJAAAABE95ZnSluL99P9+5MiCg7JoxWJbh0bXbjcLp59r5uVlOsqQol8E5e3y/rrddm/fj3d/Zbtnm/eHz//1/W93bt3mDbEdm+b33rt/btjydI1R/+wLJrfvnGpAspbzs6vX9czvNeDBYPSoqdv85HYLfoltvjgB/Z7vf47RCnUrIfhL2/8k3m2uy+lzcbmphbfr59dL2pthpnZSEEUYAPPGTVsqbat2P08l0cvqsWjIy/bAY3q/763VdNsNofJzu/u7r9vp55kitv8f1fR9Ix/MzROCJt7qTxpYlma2iuWfOju/T8XR8X663TYdano7Go/FoaNabx3PL733nNLXHrr+dn/3u70/b6yxXVszMVrqonc1tNY9GY21A1M08zbN6/f3cWwnCSJaSWoA3tTNEPpDHSYIkMIDgcf56vw4je/3/XeeRC79ZtlspSZZxuvOfzd+GueaZiL57bX1Gq6hpqiIJHmLgIP/Zo7n04oWITKu8bp5srhPGaet2d+o12pjYmUsvfrc/0LpcP35v7TiZRqIRVaOr03SvPXW1ZE1RlWhEevt5f9697W0vGaDeLmsuprfL9eP6cf3z/3oeP3w8RBpZCpkZxpELaHv1yaZarv98vZ5P58GR21vrtL16NXVZV5dv+9v7h+PBc1lKv3/uj21SivHweX/en3sHDNhO9UjgHMniQStGvovD++Goa8P++/x/SlW0ghG0CYmKKqLVULRxc1743f5pbs/7Z2P2PH2WBnt+eZ4EYgJyORIwr/vz7zwKKLc1nUYy9e/x+chMTNPKHqUSAHvlUQEb"


export class Pane extends Cell {
    constructor(props) {
        props.className = "pane"
        super(props)
        this.catchFingers()
        this.d = null
        this.active = false
        this.fontSize = props.fontSize || 12
        this.theme = props.theme || this.t7.conf.theme
        this.copyMode = false
        this.cmAtEnd = null
        this.cmCursor = null
        this.cmMarking = false
        this.dividers = []
        this.flashTimer = null
        this.aLeader = false
        this.retries = 0
        this.lastKey = ''
        this.repetition = 0
    }

    /*
     * Pane.write writes data to the terminal
     */
    write(data) {
        this.t.write(data)
    }
                
    /*
     * Pane.openTerminal opens an xtermjs terminal on our element
     */
    openTerminal(parentID, channelID) {
        console.log("in OpenTerminal")
        var con = document.createElement("div")
        this.t = new Terminal({
            convertEol: false,
            fontFamily: "FiraCode",
            fontSize: this.fontSize,
            rendererType: "canvas",
            theme: this.theme,
            rows:24,
            cols:80,
            bellStyle: "sound",
            bellSound: BELL_SOUND,
        })
        this.fitAddon = new FitAddon()
        this.searchAddon = new SearchAddon()
        this.WebLinksAddon = new WebLinksAddon((MouseEvent, url) => {
            Browser.open({ url })
        })

        // there's a container div we need to get xtermjs to fit properly
        this.e.appendChild(con)
        con.style.height = "100%"
        con.style.width = "100%"
        this.t.loadAddon(new XtermWebfont())
        // the canvas gets the touch event and the nadler needs to get back here
        this.t.loadAddon(this.fitAddon)
        this.t.loadAddon(this.searchAddon)
        this.t.loadAddon(this.WebLinksAddon)

        this.createDividers()
        this.t.onSelectionChange(() => this.selectionChanged())
        this.t.loadWebfontAndOpen(con).then(_ => {
            const webGLAddon = new WebglAddon()
            webGLAddon.onContextLoss(e => {
                console.log("lost context")
                  webGLAddon.dispose()
            })
            try {
                this.t.loadAddon(webGLAddon)
            } catch (e) { console.log("no webgl: " +e.toString()) }
            this.t.textarea.tabIndex = -1
            this.t.attachCustomKeyEventHandler(ev => {
                var toDo = true
                var meta = false
                // ctrl c is a special case 
                if (ev.ctrlKey && (ev.key == "c") && (this.d != null)) {
                    this.d.send(String.fromCharCode(3))
                    toDo = false
                }
                if (ev.ctrlKey && (ev.key == this.t7.conf.ui.leader)) {
                    this.aLeader = !this.aLeader
                    toDo = !this.aLeader
                }
                else if (ev.metaKey && (ev.key != "Shift") && (ev.key != "Meta") ||
                    this.aLeader && (ev.key != this.t7.conf.ui.leader) 
                                 && (ev.key != 'Control')) {
                    // ensure help won't pop
                    this.t7.metaPressStart = Number.MAX_VALUE
                    toDo = this.handleMetaKey(ev)
                    this.aLeader = false
                }
                else if (this.copyMode) {
                    if  (ev.type == "keydown") {
                        if (ev.ctrlKey)
                            this.handleCMKey('C-' + ev.key)
                        else
                            this.handleCMKey(ev.key)
                    }
                    toDo = false
                }
                if (!toDo) {
                    ev.stopPropagation()
                    ev.preventDefault()
                }
                return toDo
            })
            this.t.onData(d =>  {

                if (!this.d) {
                    this.gate.notify("Gate is disconnected")
                    return
                }
                const state = this.d.readyState 
                if (state != "open") {
                    this.gate.notify(`Sorry, data channel is ${state}`)
                    return
                }
                this.d.send(d)
            })
            const resizeObserver = new window.ResizeObserver(() => this.fit())
            resizeObserver.observe(this.e);
            this.fit(pane => { 
               if (pane != null)
                  pane.openChannel({parent: parentID, id: channelID})
                  .catch(e => 
                      this.gate.notify("Failed to open communication channel: "+e))
            })
        })
        return this.t
    }
    setTheme(theme) {
        this.t.setOption("theme", theme)
    }
    /*
     * Pane.scale is used to change the pane's font size
     */
    scale(by) {
        this.fontSize += by
        if (this.fontSize < 6) this.fontSize = 6
        else if (this.fontSize > 30) this.fontSize = 30
        this.t.setOption('fontSize', this.fontSize)
        this.fit()
    }

    // fit a pane to the display area. If it was resized, the server is updated.
    // returns true is size was changed
    fit(cb) {
        var oldr = this.t.rows,
            oldc = this.t.cols,
            ret = false

        // there's no point in fitting when in the middle of a restore
        //  it happens in the eend anyway
        try {
            this.fitAddon.fit()
        } catch (e) {
            if (this.retries < this.t7.conf.retries) {
                this.retries++
                this.t7.run(this.fit, 20*this.retries)
            }
            else 
                this.notify(["Failed to fit the terminal",
                             "If things look funny,",
                             "   try zoom & un-zoom"].join("\n"))
        }
        this.refreshDividers()
        if (this.t.rows != oldr || this.t.cols != oldc) {
            if (this.d) {
                this.d.resize(this.t.cols, this.t.rows)
                this.gate.sendState()
            }
            ret = true
        }
        if (cb instanceof Function) cb(this)
        return ret
    }
    /*
     * Pane.focus focuses the UI on this pane
     */
    focus() {
        super.focus()
        if (this.t !== undefined)
            setTimeout(() => this.t.focus(), 100)
        else 
            this.t7.log("can't focus, this.t is undefined")
    }
    /*
     * Splitting the pane, receivees a dir-  either "topbottom" or "rightleft"
     * and the relative size (0-1) of the area left for us.
     * Returns the new pane.
     */
    split(dir, s) {
        var sx, sy, xoff, yoff, l
        // if the current dir is `TBD` we can swing it our way
        if (typeof s == "undefined")
            s = 0.5
        if ((this.layout.dir == "TBD") || (this.layout.cells.length == 1))
            this.layout.dir = dir
        // if we need to create a new layout do it and add us and new pane as cells
        if (this.layout.dir != dir)
            l = this.w.addLayout(dir, this)
        else 
            l = this.layout

        // update the dimensions & position
        if (dir == "rightleft") {
            sy = this.sy * (1 - s)
            sx = this.sx
            xoff = this.xoff
            this.sy -= sy
            yoff = this.yoff + this.sy
        }
        else  {
            sy = this.sy
            sx = this.sx * (1 - s)
            yoff = this.yoff
            this.sx -= sx
            xoff = this.xoff + this.sx
        }
        this.fit()

        // add the new pane
        let p = l.addPane({sx: sx, sy: sy, 
                       xoff: xoff, yoff: yoff,
                       parent: this})
        p.focus()
        this.gate.sendState()
        return p
    }
    onChannelConnected(channel, id) {
        console.log("onChannelConnected")
        const reconnect = this.d != null
        this.d = channel
        this.d.onMessage = m => this.onChannelMessage(m)
        this.d.onClose = () => {
            this.d = undefined 
            this.close()
        }
        if (!reconnect)
            this.gate.sendState()
    }
    openChannel(opts) {
        return new Promise((resolve, reject) => {
            if (!this.gate.session) {
                reject("Gate has no session yet")
                return
            }
            if (this.d && (this.d.readyState == "open"))
                return
            this.buffer = []
            if (opts.id) {
                this.gate.session.openChannel(opts.id)
                .then((channel, id) =>this.onChannelConnected(channel, id))
                .then(resolve)
                .catch(m => console.log(m))
            } else {
                this.gate.session.openChannel(
                    this.t7.conf.exec.shell, opts.parent, this.t.cols, this.t.rows)
                .then((channel, id) =>this.onChannelConnected(channel, id))
                .then(resolve)
                .catch(m => console.log(m))
            }
        })
    }
    flashIndicator () {
        if (this.flashTimer == null) {
            let  flashTime = this.t7.conf.indicators && this.t7.conf.indicators.flash
                             || 88
            this.gate.setIndicatorColor("#373702")
            this.flashTimer = this.t7.run(_ => {
                this.flashTimer = null
                this.gate.setIndicatorColor("unset")
            }, flashTime) 
        }
    }
    // called when a message is received from the server
    onChannelMessage (m) {
        this.flashIndicator()
        this.write(m)
    }
    toggleZoom() {
        super.toggleZoom()
        this.fit()
    }
    toggleSearch(searchDown) {
        const se = this.gate.e.querySelector(".search-box")
        if (se.classList.contains("hidden"))
            this.showSearch()
        else {
            this.hideSearch()
            this.focus()
        }
    }

    showSearch(searchDown) {
        // show the search field
        this.searchDown = searchDown || false
        const se = this.gate.e.querySelector(".search-box")
        se.classList.remove("hidden")
        document.getElementById("search-button").classList.add("on")
        // TODO: restore regex search
        let i = se.querySelector("input[name='search-term']")
        this.disableSearchButtons()
        if (REGEX_SEARCH) {
            i.setAttribute("placeholder", "regex here")
            u.classList.remove("hidden")
            f.classList.remove("hidden")
            u.onclick = ev => {
                ev.preventDefault()
                ev.stopPropagation()
                this.focus()
                i.value = this.searchTerm = urlRegex
            }
            // TODO: findPrevious does not work well
            f.onclick = _ => this.searchAddon.findPrevious(fileRegex, SEARCH_OPTS)
        } else 
            i.setAttribute("placeholder", "search string here")
        if (this.searchTerm)
            i.value = this.searchTerm

        i.onkeydown = ev => {
            if (ev.keyCode == 13) {
                this.findPrev(i.value)
                this.enableSearchButtons()
                this.t7.run(() => this.t.focus(), 10)
            }
        }
        i.addEventListener("input", () => {
            this.searchTerm = i.value
            if (i.value) {
                this.enableSearchButtons()
            }
            else {
                this.disableSearchButtons()
            }
        })
        i.focus()
    }
    enterCopyMode(marking) {
        if (marking)
            this.cmMarking = true
        if (!this.copyMode) {
            this.copyMode = true
            this.cmInitCursor()
            this.cmAtEnd = null
            if (this.zoomed)
                this.t7.zoomedE.children[0].style.borderColor = COPYMODE_BORDER_COLOR
            else
                this.e.style.borderColor = COPYMODE_BORDER_COLOR
            Storage.get({key: "first_copymode"}).then(v => {
                if (v.value != "1") {
                    var e = document.getElementById("help-copymode")
                    e.classList.remove("hidden")
                    Storage.set({key: "first_copymode", value: "1"})
                }
            })
        }
    }
    exitCopyMode() {
        if (this.copyMode) {
            this.copyMode = false
            this.e.style.borderColor = FOCUSED_BORDER_COLOR
            this.t.clearSelection()
            this.t.scrollToBottom()
            if (this.zoomed)
                this.t7.zoomedE.children[0].style.borderColor = FOCUSED_BORDER_COLOR
            else
                this.e.style.borderColor = FOCUSED_BORDER_COLOR
            this.focus()
        }
    }
    hideSearch() {
        const se = this.gate.e.querySelector(".search-box")
        se.classList.add("hidden")
        document.getElementById("search-button").classList.remove("on")
    }
    exitSearch() {
        this.hideSearch();
        this.exitCopyMode();
    }
    handleMetaKey(ev) {
        var f = null
        this.t7.log(`Handling meta key ${ev.key}`)
        switch (ev.key) {
        case "c":
            if (this.t.hasSelection()) 
                this.copySelection()
            break
        case "z":
            f = () => this.toggleZoom()
            break
        case ",":
            f = () => this.w.rename()
            break
        case "d":
            f = () => this.close()
            break
        case "0":
            f = () => this.scale(12 - this.fontSize)
            break
        case "=":
                f = () => this.scale(1)
            break
        case "-":
            f = () => this.scale(-1)
            break
        case "5":
            f = () => this.split("topbottom")
            break
        case "'":
            f = () => this.split("rightleft")
            break
        case "[":
   
            f = () => this.enterCopyMode()
            break
        case "f":
            f = () => this.showSearch()
            break
        // next two keys are on the gate level
        case "t":
            f = () => this.gate.newTab()
            break
        case "r":
            f = () => this.gate.disengage().then(() => this.gate.connect())
            break
        // this key is at terminal level
        case "l":
            f = () => this.t7.logDisplay()
            break
        case "ArrowLeft":
            f = () => this.w.moveFocus("left")
            break
        case "ArrowRight":
            f = () => this.w.moveFocus("right")
            break
        case "ArrowUp":
            f = () => this.w.moveFocus("up")
            break
        case "ArrowDown":
            f = () => this.w.moveFocus("down")
            break
        case "9":
            f = () => this.t7.dumpLog()
            break
        }

        if (f != null) {
            f()
            return false
        }
        return true
    }
    findNext(searchTerm) {
        if (searchTerm) {
            this.cmAtEnd = null
            this.t.setOption("selectionStyle", "plain")
            this.searchTerm = searchTerm
        }

        if (this.searchTerm) {
            if (!this.searchAddon.findNext(this.searchTerm, SEARCH_OPTS))
                this.gate.notify(`Couldn't find "${this.searchTerm}"`)
            else 
                this.enterCopyMode(true)
        }
    }
    findPrev(searchTerm) {
        if (searchTerm) {
            this.cmAtEnd = null
            this.t.setOption("selectionStyle", "plain")
            this.searchTerm = searchTerm
        }

        if (this.searchTerm) {
            if (!this.searchAddon.findPrevious(this.searchTerm, SEARCH_OPTS))
                this.gate.notify(`Couldn't find "${this.searchTerm}"`)
            else 
                this.enterCopyMode(true)
        }
    }
    /*
     * createDividers creates a top and left educationsl dividers.
     * The dividers are here because they're elegant and they let the user know
     * he can move the borders
     * */
    createDividers() {
        // create the dividers
        var t = document.getElementById("divider-template")
        if (t) {
            var d = [t.content.cloneNode(true),
                     t.content.cloneNode(true)]
            d.forEach((e, i) => {
                this.w.e.prepend(e)
                e = this.w.e.children[0]
                e.classList.add((i==0)?"left-divider":"top-divider")
                e.pane = this
                this.dividers.push(e)
            })
        }
    }
    /*
     * refreshDividerrs rrepositions the dividers after the pane has been
     * moved or resized
     */
    refreshDividers() {
        var W = this.w.e.offsetWidth,
            H = this.w.e.offsetHeight,
            d = this.dividers[0]
        if (this.xoff > 0.001 & this.sy * H > 50) {
            // refresh left divider position
            d.style.left = `${this.xoff * W - 4 - 20 }px`
            d.style.top = `${(this.yoff + this.sy/2)* H - 22 - 40}px`
            d.classList.remove("hidden")
        } else
            d.classList.add("hidden")
        d = this.dividers[1]
        if (this.yoff > 0.001 & this.sx * W > 50) {
            // refresh top divider position
            d.style.top = `${this.yoff * H - 25 - 20 }px`
            d.style.left = `${(this.xoff + this.sx/2)* W - 22 - 40}px`
            d.classList.remove("hidden")
        } else
            d.classList.add("hidden")
    }
    close() {
        if (this.d)
            this.d.close()
        this.dividers.forEach(d => d.classList.add("hidden"))
        document.querySelector('.add-tab').classList.remove("off")
        super.close()
    }
    dump() {
        var cell = {
            sx: this.sx,
            sy: this.sy,
            xoff: this.xoff,
            yoff: this.yoff,
            fontSize: this.fontSize
        }
        if (this.d)
            cell.channel_id = this.d.id
        if (this.w.activeP && this == this.w.activeP)
            cell.active = true
        if (this.zoomed)
            cell.zoomed = true
        return cell
    }
    // listening for terminal selection changes
    selectionChanged() {
        const selection = this.t.getSelectionPosition()
        if (selection != null) {
            this.copySelection()
            this.t.clearSelection()
        }
    }
    copySelection() {
        let i,
            ret = "",
            lines = this.t.getSelection().split('\n')
        for (i = 0; i < lines.length; i++)
            ret += lines[i].trimEnd()+'\n'
    
        return Clipboard.write({string: ret})
    }
    handleCMKey(key) {
        var x, y, newX, newY,
            selection = this.t.getSelectionPosition(),
            line
        // chose the x & y we're going to change
        if ((!this.cmMarking) || (selection == null)) {
            this.cmMarking = false
            if (!this.cmCursor)
                this.cmInitCursor()
            x = this.cmCursor.x
            y =  this.cmCursor.y; 
            selection = {
                startColumn: x,
                endColumn: x,
                startRow: y,
                endRow: y
            }
        }
        else if (this.cmAtEnd) {
            x = selection.endColumn
            y = selection.endRow; 
        }
        else {
            x = selection.startColumn
            y = selection.startRow; 
        }
        newX = x
        newY = y
        if (this.repetition || key.match(/[1-9]/)) {
            if (key.match(/\d/))
                this.repetition = 10 * this.repetition + parseInt(key)
            else {
                let temp = this.repetition
                this.repetition = 0
                for (let i = 0; i < temp; i++) {
                    this.handleCMKey(key)
                }
            }
        }
        else if (this.lastKey) {
            switch (key) {
                case 'Escape':
                case 'ArrowRight':
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'ArrowDown':
                    break
                default:
                    if (!key.match(/^.$/))
                        return
                    break
            }
            switch (this.lastKey) {
                case 'f':
                    line = this.t.buffer.active.getLine(y).translateToString(true).trimEnd()
                    newX = line.indexOf(key, x + 1)
                    if (newX == -1)
                        newX = x
                    else if (this.cmMarking)
                        newX++
                    break
                case 'F':
                    line = this.t.buffer.active.getLine(y).translateToString(true).trimEnd()
                    newX = line.lastIndexOf(key, x - 2)
                    if (newX == -1)
                        newX = x
                    break
                case 't':
                    line = this.t.buffer.active.getLine(y).translateToString(true).trimEnd()
                    newX = line.indexOf(key, x + 1) - 1
                    if (newX == -2)
                        newX = x
                    else if (this.cmMarking)
                        newX++
                    break
                case 'T':
                    line = this.t.buffer.active.getLine(y).translateToString(true).trimEnd()
                    newX = line.lastIndexOf(key, x - 2) + 1
                    if (newX == 0)
                        newX = x
                    break
            }
            this.lastKey = ''
        }
        else switch(key) {
            // space is used to toggle the marking state
            case ' ':
                if (!this.cmMarking) {
                    // entering marking mode, start the selection on the cursor
                    // with unknown direction
                    this.cmAtEnd = null
                } else {
                    this.cmInitCursor()
                }
                this.cmMarking = !this.cmMarking
                console.log("setting marking:", this.cmMarking)
                this.cmSelectionUpdate(selection)
                break
            case "Enter":
                if (this.t.hasSelection())
                    this.copySelection().then(this.exitCopyMode())
                else
                    this.exitCopyMode();
                break
            case '/':
                this.showSearch(true)
                break
            case '?':
                this.showSearch()
                break
            case 'Escape':
            case 'q':
                this.exitCopyMode()
                break
            case 'n':
                this.findNext()
                break
            case 'ArrowLeft':
            case 'h':
                if (x > 0) 
                    newX = x - 1
                if (this.cmAtEnd === null)
                    this.cmAtEnd = false
                break
            case 'ArrowRight':
            case 'l':
                if (x < this.t.cols - 2)
                    newX = x + 1
                if (this.cmAtEnd === null)
                    this.cmAtEnd = true
                break
            case 'ArrowDown':
            case 'j':
                if (y < this.t.buffer.active.baseY + this.t.rows)
                    newY = y + 1
                if (this.cmAtEnd === null)
                    this.cmAtEnd = true
                break
            case 'ArrowUp':
            case 'k':
                if (y > 0)
                    newY = y - 1
                if (this.cmAtEnd === null)
                    this.cmAtEnd = false
                break
            case '0':
                newX = 0
                break
            case '$':
                line = this.t.buffer.active.getLine(y).translateToString(true).trimEnd()
                newX = line.length
                if (newX != 0 && !this.cmMarking)
                    newX--
                break
            case 'w':
                line = this.t.buffer.active.getLine(y).translateToString(true).trimEnd()
                while (newX < line.length) {
                    if (line.substring(newX, newX + 2).match(/\W\w/)
                        || line.substring(newX, newX + 2).match(/\w[^\w\s]/)
                        || line.substring(newX, newX + 2).match(/\s\S/)) {
                        newX++
                        break
                    }
                    newX++
                }
                if (newX >= line.length) {
                    if (this.t.buffer.active.getLine(y+1)?.translateToString(true).trimEnd()) {
                        newX = 0
                        newY++
                    } else
                        newX = line.length - 1
                }
                if (this.cmMarking)
                    newX++
                break
            case 'b':
                line = this.t.buffer.active.getLine(y).translateToString(true).trimEnd()
                if (x <= 0 && y > 0) {
                    newY--
                    line = this.t.buffer.active.getLine(newY).translateToString(true).trimEnd()
                    newX = line.length
                }
                while (newX > 0) {
                    if (line.substring(newX - 2, newX).match(/\W\w/)
                        || line.substring(newX - 2, newX).match(/\w[^\w\s]/)
                        || line.substring(newX - 2, newX).match(/\s\S/)) {
                        newX--
                        break
                    }
                    newX--
                }
                break
            case 'e':
                line = this.t.buffer.active.getLine(y).translateToString(true).trimEnd()
                if (newX >= line.length - 1) {
                    line = this.t.buffer.active.getLine(y+1).translateToString(true).trimEnd()
                    if (!line) break
                    newX = 0
                    newY++
                }
                while (newX < line.length) {
                    newX++
                    if (newX == line.length) {
                        newX--
                        break
                    }
                    if (line.substring(newX, newX + 2).match(/\w\W/)
                        || line.substring(newX, newX + 2).match(/[^\w\s]\w/)
                        || line.substring(newX, newX + 2).match(/\S\s/))
                        break
                }
                if (this.cmMarking)
                    newX++
                break
            case 'f':
            case 'F':
            case 't':
            case 'T':
                console.log("waiting for input")
                this.lastKey = key
                break
            case 'C-f':
                newY = this.t.buffer.active.viewportY + this.t.buffer.active.length - this.t.buffer.active.baseY
                if (newY >= this.t.buffer.active.length) 
                    newY = this.t.buffer.active.length - 1
                break
            case 'C-b':
                console.log('y', this.t.buffer.active.baseY, this.t.buffer.active.viewportY, this.t.buffer.active.length, this.t.rows)
                newY = this.t.buffer.active.viewportY - (this.t.buffer.active.length - this.t.buffer.active.baseY)
                if (newY < 0) 
                    newY = 0
                break
        }
        if ((newY != y) || (newX != x)) {
            if (!this.cmMarking) {
                this.cmCursor.x = newX
                this.cmCursor.y = newY; 
            }
            else if (this.cmAtEnd) {
                if ((newY < selection.startRow) || 
                   ((newY == selection.startRow)
                    && (newX < selection.startColumn))) {
                    this.cmAtEnd = false
                    selection.endRow = selection.startRow
                    selection.endColumn = selection.startColumn
                    selection.startRow = newY
                    selection.startColumn = newX
                } else {
                    selection.endColumn = newX
                    selection.endRow = newY
                }
            }
            else {
                if ((newY > selection.endRow) ||
                    ((newY == selection.endRow)
                     && (newX > selection.endColumn))) {
                    this.cmAtEnd = true
                    selection.endRow = newY
                    selection.endColumn = newX
                } else {
                    selection.startColumn = newX
                    selection.startRow = newY
                }
            }
            this.cmSelectionUpdate(selection)
            if ((newY >= this.t.buffer.active.viewportY + this.t.rows) ||
                (newY < this.t.buffer.active.viewportY)) {
                let scroll = newY - this.t.buffer.active.viewportY
                this.t.scrollLines(scroll, true)
                console.log(scroll, this.t.buffer.active.viewportY, this.t.buffer.active.baseY)
            }
        }
    }
    cmInitCursor() {
        var selection = this.t.getSelectionPosition()
        if (selection) {
            this.cmCursor = {
                x: this.cmAtEnd?selection.endColumn:selection.startColumn,
                y: this.cmAtEnd?selection.endRow:selection.startRow
            }
            return
        }
        const buffer = this.t.buffer.active
        this.cmCursor = {x: buffer.cursorX,
                         y: buffer.cursorY + buffer.viewportY}
    }
    cmSelectionUpdate(selection) {
        if (this.cmAtEnd == null)
            this.t.setOption("selectionStyle", "plain")
        else
            this.t.setOption("selectionStyle", this.cmAtEnd?"mark-end":"mark-start")
        // maybe it's a cursor
        if (!this.cmMarking) {
            console.log("using selection to draw a cursor at", this.cmCursor)
            this.t.select(this.cmCursor.x, this.cmCursor.y, 1)
            return
        }
        if (!this.cmAtEnd) {
            if (selection.startRow > selection.endRow) {
                selection.endRow = selection.startRow
            }
            if (selection.endRow === selection.startRow) {
                if (selection.startColumn > selection.endColumn) {
                    selection.endColumn = selection.startColumn
                }    
            }
        } else {
            if (selection.startRow > selection.endRow) {
                selection.startRow = selection.endRow
            }
            if (selection.startRow === selection.endRow) {
                if (selection.startColumn > selection.endColumn) {
                    selection.startColumn = selection.endColumn
                }    
            }
        }
        const rowLength = this.t.cols
        let selectionLength = rowLength*(selection.endRow - selection.startRow) + selection.endColumn - selection.startColumn
        if (selectionLength == 0) selectionLength = 1
        this.t.select(selection.startColumn, selection.startRow, selectionLength)
    }
    enableSearchButtons() {
        const se = this.gate.e.querySelector(".search-box")
        let up = se.querySelector(".search-up"),
            down = se.querySelector(".search-down")
        up.classList.remove("off")
        down.classList.remove("off")
    }
    disableSearchButtons() {
        const se = this.gate.e.querySelector(".search-box")
        let up = se.querySelector(".search-up"),
            down = se.querySelector(".search-down")
        up.classList.add("off")
        down.classList.add("off")
    }
    regexFindIndex(str, regex, startIndex) {
        startIndex = startIndex || 0
        let match = -1
        str.replace(regex, (...args) => {
            let i = args.find(x => typeof(x) == "number")
            if (match == -1 && i > startIndex)
                match = i
        })
        return match
    }
}
