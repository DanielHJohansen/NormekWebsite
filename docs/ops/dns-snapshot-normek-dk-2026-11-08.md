# DNS snapshot: normek.dk (2026-11-08)

Read through Simply's official connector, with no changes made. Records only, no secrets. Use it as the rollback reference before any change. Record ids change when a record is recreated.

- Product: Basic Suite (web hosting plus email) at Simply.com.
- Nameservers at the registry: ns1.simply.com, ns2.simply.com, ns3.simply.com.
- DNSSEC: one DS key published at the registry (key tag 41103, algorithm 13, digest type 2).

## Zone (15 records, TTL 3600 on all)

| Id | Name | Type | Data | Priority |
|---|---|---|---|---|
| 27691787 | @ | NS | ns1.simply.com | |
| 27691788 | @ | NS | ns2.simply.com | |
| 27691789 | @ | NS | ns3.simply.com | |
| 27691790 | @ | A | 185.20.205.55 | |
| 27691791 | www | A | 185.20.205.55 | |
| 27691792 | * | A | 185.20.205.55 | |
| 27691793 | @ | MX | mx.simply.com | 10 |
| 27691798 | @ | TXT | v=spf1 include:spf.simply.com -all | |
| 27691797 | _dmarc | CNAME | dmarc.simply.com | |
| 27691795 | simplycom1._domainkey | CNAME | dkim1.simply.com | |
| 27691796 | simplycom2._domainkey | CNAME | dkim2.simply.com | |
| 27691794 | autoconfig | CNAME | maildiscover.simply.com | |
| 27691799 | _autodiscover._tcp | SRV | 10 443 maildiscover.simply.com | 10 |
| 27691800 | _caldavs._tcp | SRV | 20 443 dav.simply.com | 10 |
| 27691801 | _carddavs._tcp | SRV | 20 443 dav.simply.com | 10 |

## Other facts

- At snapshot time: mail accounts none, mail forwards none, hosted subdomains none. Later on 2026-11-08 the mailbox daniel@normek.dk was created (no DNS change).
- The bare domain, `www` and the wildcard all point at the Simply web server for this product.
- There is no CAA record, and no MTA-STS or TLS reporting record.
- DMARC and DKIM are delegated to Simply by CNAME, so Simply controls the DMARC policy and the report address. The policy itself has not been read.
- The web server shows a Simply placeholder over plain HTTP (no certificate is active).
